<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AssessmentController extends Controller
{
    public function upkkPracticalIndex(Request $request, string $kind): JsonResponse
    {
        abort_unless(in_array($kind, ['amali', 'pchi'], true), 404);
        $table = $kind === 'amali' ? 'upkk_amali_solat_marks' : 'upkk_pchi_marks';
        $user = $request->user(); $query = DB::table($table)->orderByDesc('updated_at');
        if (! in_array($user->role, ['OWNER', 'ADMIN_DAERAH'], true)) $query->where('kod_sekolah', $user->kod_sekolah);
        return response()->json(['data' => $query->get()]);
    }

    public function upkkContext(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'max:40'], 'tahun_akademik' => ['required', 'integer'], 'class_id' => ['required', 'uuid', 'exists:classes,id'], 'sesi' => ['required', 'integer', 'in:1,2'], 'exam_id' => ['nullable', 'uuid']]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        abort_unless(DB::table('classes')->where(['id' => $data['class_id'], 'kod_sekolah' => $data['kod_sekolah'], 'tahun' => 5, 'tahun_akademik' => $data['tahun_akademik']])->exists(), 422, 'Kelas tidak sepadan dengan UPKK.');
        $trial = DB::table('upkk_trial_paper_marks')->where(['kod_sekolah' => $data['kod_sekolah'], 'tahun_akademik' => $data['tahun_akademik'], 'class_id' => $data['class_id'], 'sesi' => $data['sesi']])->get();
        $standard = ($data['exam_id'] ?? null) ? DB::table('marks')->where(['exam_id' => $data['exam_id'], 'kod_sekolah' => $data['kod_sekolah'], 'class_id' => $data['class_id']])->whereNotNull('markah')->get() : collect();
        $grades = DB::table('upkk_trial_grade_settings')->where('kod_sekolah', $data['kod_sekolah'])->first() ?? (object) ['kod_sekolah' => $data['kod_sekolah'], 'grade_a_min' => 85, 'grade_b_min' => 65, 'grade_c_min' => 45];
        return response()->json(['trial' => $trial, 'standard' => $standard, 'grades' => $grades]);
    }

    public function upkkGrades(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'max:40'], 'grade_a_min' => ['required', 'integer', 'between:1,100'], 'grade_b_min' => ['required', 'integer', 'between:1,100'], 'grade_c_min' => ['required', 'integer', 'between:1,100']]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        abort_unless($data['grade_a_min'] > $data['grade_b_min'] && $data['grade_b_min'] > $data['grade_c_min'], 422, 'Julat gred tidak sah.');
        DB::table('upkk_trial_grade_settings')->updateOrInsert(['kod_sekolah' => $data['kod_sekolah']], [...$data, 'updated_by' => $request->user()->id, 'updated_at' => now()]);
        return response()->json(['data' => DB::table('upkk_trial_grade_settings')->where('kod_sekolah', $data['kod_sekolah'])->first()]);
    }
    public function psraDashboard(Request $request): JsonResponse
    {
        $data = $request->validate(['tahun_akademik' => ['required', 'integer'], 'sesi' => ['required', 'string', 'max:40'], 'exam_id' => ['nullable', 'uuid']]);
        $paper = DB::table('psra_trial_paper_marks')->where(['tahun_akademik' => $data['tahun_akademik'], 'sesi' => $data['sesi']])->get();
        $standard = $data['exam_id'] ? DB::table('marks')->where('exam_id', $data['exam_id'])->whereNotNull('markah')->get()->map(fn ($row) => (object) ['id' => $row->id, 'kod_sekolah' => $row->kod_sekolah, 'tahun_akademik' => $data['tahun_akademik'], 'class_id' => $row->class_id, 'student_id' => $row->student_id, 'sesi' => $data['sesi'], 'paper_code' => $row->kod_subjek, 'markah' => $row->markah, 'entered_by' => '', 'updated_by' => '', 'updated_at' => '']) : collect();
        return response()->json(['data' => $paper->merge($standard)->values()]);
    }

    public function psraPaperMarks(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kod_sekolah' => ['required', 'string', 'max:40'], 'tahun_akademik' => ['required', 'integer', 'between:2000,2100'], 'sesi' => ['required', 'integer', 'in:1,2'],
            'class_id' => ['required', 'uuid', 'exists:classes,id'], 'student_id' => ['required', 'uuid', 'exists:students,id'],
            'sesi' => ['required', 'integer', 'in:1,2'], 'paper_code' => ['required', 'in:AS01,BA02,JIK03,TF04,TJ05'],
            'markah' => ['required', 'numeric', 'between:0,100'],
        ]);
        $this->assertStudentScope($request, $data, 6);
        $id = DB::table('psra_trial_paper_marks')->where(['tahun_akademik' => $data['tahun_akademik'], 'student_id' => $data['student_id'], 'sesi' => $data['sesi'], 'paper_code' => $data['paper_code']])->value('id') ?? (string) Str::uuid();
        DB::table('psra_trial_paper_marks')->updateOrInsert(
            ['id' => $id],
            [...$data, 'entered_by' => $request->user()->id, 'updated_by' => $request->user()->id, 'updated_at' => now(), 'created_at' => now()]
        );
        return response()->json(['data' => DB::table('psra_trial_paper_marks')->where('id', $id)->first()], 201);
    }

    public function upkkPaperMarks(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kod_sekolah' => ['required', 'string', 'max:40'], 'tahun_akademik' => ['required', 'integer', 'between:2000,2100'], 'sesi' => ['required', 'integer', 'in:1,2'],
            'class_id' => ['required', 'uuid', 'exists:classes,id'], 'student_id' => ['required', 'uuid', 'exists:students,id'],
            'paper_code' => ['required', 'in:UPKK02,UPKK03,UPKK04,UPKK05,UPKK06,UPKK07'], 'markah' => ['required', 'integer', 'between:0,100'],
        ]);
        $this->assertStudentScope($request, $data, 5);
        $id = DB::table('upkk_trial_paper_marks')->where(['tahun_akademik' => $data['tahun_akademik'], 'student_id' => $data['student_id'], 'sesi' => $data['sesi'] ?? 1, 'paper_code' => $data['paper_code']])->value('id') ?? (string) Str::uuid();
        DB::table('upkk_trial_paper_marks')->updateOrInsert(
            ['id' => $id],
            [...$data, 'sesi' => $data['sesi'] ?? 1, 'entered_by' => $request->user()->id, 'updated_by' => $request->user()->id, 'updated_at' => now(), 'created_at' => now()]
        );
        return response()->json(['data' => DB::table('upkk_trial_paper_marks')->where('id', $id)->first()], 201);
    }

    public function upkkPracticalMarks(Request $request, string $kind): JsonResponse
    {
        abort_unless(in_array($kind, ['amali', 'pchi'], true), 404);
        $data = $request->validate([
            'kod_sekolah' => ['required', 'string', 'max:40'], 'tahun_akademik' => ['required', 'integer', 'between:2000,2100'],
            'class_id' => ['required', 'uuid', 'exists:classes,id'], 'student_id' => ['required', 'string', 'max:40'],
            'scores' => ['required', 'array'], 'jumlah' => ['required', 'numeric', 'min:0'], 'status' => ['required', 'in:DRAF,LENGKAP'],
        ]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        abort_unless(DB::table('classes')->where(['id' => $data['class_id'], 'kod_sekolah' => $data['kod_sekolah'], 'tahun' => 5, 'tahun_akademik' => $data['tahun_akademik']])->exists(), 422, 'Kelas tidak sepadan dengan UPKK.');
        abort_unless(DB::table('students')->where(['mykid' => $data['student_id'], 'class_id' => $data['class_id'], 'kod_sekolah' => $data['kod_sekolah'], 'status' => 'AKTIF'])->exists(), 422, 'Murid tidak sepadan dengan kelas.');
        $table = $kind === 'amali' ? 'upkk_amali_solat_marks' : 'upkk_pchi_marks';
        $existing = DB::table($table)->where(['tahun_akademik' => $data['tahun_akademik'], 'student_mykid' => $data['student_id']])->value('id');
        $id = $existing ?? (string) Str::uuid();
        $row = ['id' => $id, 'kod_sekolah' => $data['kod_sekolah'], 'tahun_akademik' => $data['tahun_akademik'], 'class_id' => $data['class_id'], 'student_mykid' => $data['student_id'], 'scores' => json_encode($data['scores']), 'jumlah' => $data['jumlah'], 'status' => $data['status'], 'updated_at' => now()];
        if (!$existing) $row['created_at'] = now();
        DB::table($table)->updateOrInsert(['id' => $id], $row);
        return response()->json(['data' => DB::table($table)->where('id', $id)->first()], $existing ? 200 : 201);
    }

    public function psraReport(Request $request, string $classId): JsonResponse
    {
        $class = DB::table('classes')->where('id', $classId)->first();
        abort_unless($class && $request->user()->canAccessSchool($class->kod_sekolah), 404);
        return response()->json(['data' => DB::table('psra_trial_paper_marks')->where('class_id', $classId)->orderBy('student_id')->orderBy('sesi')->get()]);
    }

    public function upkkReport(Request $request, string $classId): JsonResponse
    {
        $class = DB::table('classes')->where('id', $classId)->first();
        abort_unless($class && $request->user()->canAccessSchool($class->kod_sekolah), 404);
        return response()->json(['data' => DB::table('upkk_trial_paper_marks')->where('class_id', $classId)->orderBy('student_id')->get()]);
    }

    private function assertStudentScope(Request $request, array $data, int $year): void
    {
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        abort_unless(DB::table('classes')->where(['id' => $data['class_id'], 'kod_sekolah' => $data['kod_sekolah'], 'tahun' => $year, 'tahun_akademik' => $data['tahun_akademik']])->exists(), 422, 'Kelas tidak sepadan dengan modul atau sekolah.');
        abort_unless(DB::table('students')->where(['id' => $data['student_id'], 'class_id' => $data['class_id'], 'kod_sekolah' => $data['kod_sekolah'], 'status' => 'AKTIF'])->exists(), 422, 'Murid tidak sepadan dengan kelas atau sekolah.');
    }
}
