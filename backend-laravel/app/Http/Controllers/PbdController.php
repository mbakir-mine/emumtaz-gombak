<?php

namespace App\Http\Controllers;

use App\Models\PbdAssessment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PbdController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $schoolCodes = \App\Models\School::query()->get()->filter(fn ($school) => $request->user()->canAccessSchool($school->kod_sekolah))->pluck('kod_sekolah');
        $rows = DB::table('pbd_marks as pm')->join('pbd_assessments as pa', 'pa.id', '=', 'pm.assessment_id')->join('students as s', 's.id', '=', 'pm.student_id')->whereIn('pa.kod_sekolah', $schoolCodes)->select('pm.*', 's.mykid', 's.nama as student_nama', 's.jantina', 's.kod_sekolah as student_school', 's.class_id as student_class', 's.status as student_status', 'pa.kod_sekolah', 'pa.class_id', 'pa.tahun_akademik', 'pa.kod_subjek', 'pa.teacher_id', 'pa.tarikh', 'pa.tajuk', 'pa.instrumen', 'pa.markah_penuh', 'pa.status as assessment_status')->orderBy('pm.student_id')->get();
        return response()->json(['data' => $rows]);
    }

    public function storeAssessment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'class_id' => ['required', 'uuid', 'exists:classes,id'], 'tahun_akademik' => ['required', 'integer', 'between:2000,2100'],
            'kod_subjek' => ['required', 'string', 'exists:subjects,kod_subjek'], 'tarikh' => ['required', 'date'],
            'tajuk' => ['required', 'string', 'max:180'], 'instrumen' => ['required', 'string', 'max:120'],
            'markah_penuh' => ['required', 'numeric', 'gt:0', 'max:9999'],
        ]);
        $class = \App\Models\SchoolClass::query()->findOrFail($data['class_id']);
        abort_unless($request->user()->canAccessSchool($class->kod_sekolah), 403);
        $role = $request->user()->role;
        if ($role === \App\Models\User::SUBJECT_TEACHER && ! DB::table('teacher_subject_assignments')->where(['user_id' => $request->user()->id, 'class_id' => $class->id, 'kod_subjek' => $data['kod_subjek']])->exists()) abort(403);
        $assessment = PbdAssessment::query()->updateOrCreate(
            ['class_id' => $class->id, 'kod_subjek' => $data['kod_subjek'], 'tarikh' => $data['tarikh'], 'tajuk' => $data['tajuk'], 'instrumen' => $data['instrumen']],
            array_merge($data, ['id' => (string) Str::uuid(), 'kod_sekolah' => $class->kod_sekolah, 'teacher_id' => $request->user()->id, 'status' => 'AKTIF']),
        );
        return response()->json(['data' => $assessment], 201);
    }

    public function storeMarks(Request $request, string $assessmentId): JsonResponse
    {
        $assessment = PbdAssessment::query()->findOrFail($assessmentId);
        abort_unless($request->user()->canAccessSchool($assessment->kod_sekolah), 403);
        $data = $request->validate(['records' => ['required', 'array', 'min:1', 'max:100'], 'records.*.student_id' => ['required', 'uuid', 'exists:students,id'], 'records.*.markah' => ['nullable', 'numeric', 'between:0,100'], 'records.*.tahap_penguasaan' => ['nullable', 'integer', 'between:1,6'], 'records.*.catatan' => ['nullable', 'string', 'max:500']]);
        $rows = collect($data['records'])->map(fn (array $record): array => array_merge($record, ['id' => (string) Str::uuid(), 'assessment_id' => $assessment->id, 'created_at' => now(), 'updated_at' => now()]))->all();
        DB::table('pbd_marks')->upsert($rows, ['assessment_id', 'student_id'], ['markah', 'tahap_penguasaan', 'catatan', 'updated_at']);
        return response()->json(['ok' => true, 'count' => count($rows)]);
    }
}
