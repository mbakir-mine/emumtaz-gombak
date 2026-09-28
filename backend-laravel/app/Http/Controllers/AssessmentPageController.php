<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AssessmentPageController extends Controller
{
    public function psra(Request $request): View
    {
        return view('admin.assessments', ['title' => 'Percubaan PSRA', 'kind' => 'psra', 'classes' => $this->classes($request, 6), 'students' => $this->students($request, 6), 'papers' => ['AS01', 'BA02', 'JIK03', 'TF04', 'TJ05']]);
    }

    public function upkk(Request $request): View
    {
        return view('admin.assessments', ['title' => 'Percubaan UPKK', 'kind' => 'upkk', 'classes' => $this->classes($request, 5), 'students' => $this->students($request, 5), 'papers' => ['UPKK02', 'UPKK03', 'UPKK04', 'UPKK05', 'UPKK06', 'UPKK07']]);
    }

    public function storePsra(Request $request)
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'max:40'], 'tahun_akademik' => ['required', 'integer'], 'class_id' => ['required', 'uuid', 'exists:classes,id'], 'student_id' => ['required', 'uuid', 'exists:students,id'], 'sesi' => ['required', 'in:1,2'], 'paper_code' => ['required', 'in:AS01,BA02,JIK03,TF04,TJ05'], 'markah' => ['required', 'numeric', 'between:0,100']]);
        $this->savePaper($request, $data, 'psra_trial_paper_marks', ['sesi' => $data['sesi'], 'paper_code' => $data['paper_code']], 6);
        return redirect()->route('admin.assessments.psra')->with('status', 'Markah PSRA berjaya disimpan.');
    }

    public function storeUpkk(Request $request)
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'max:40'], 'tahun_akademik' => ['required', 'integer'], 'class_id' => ['required', 'uuid', 'exists:classes,id'], 'student_id' => ['required', 'uuid', 'exists:students,id'], 'paper_code' => ['required', 'in:UPKK02,UPKK03,UPKK04,UPKK05,UPKK06,UPKK07'], 'markah' => ['required', 'integer', 'between:0,100']]);
        $this->savePaper($request, $data, 'upkk_trial_paper_marks', ['paper_code' => $data['paper_code']], 5);
        return redirect()->route('admin.assessments.upkk')->with('status', 'Markah UPKK berjaya disimpan.');
    }

    private function savePaper(Request $request, array $data, string $table, array $extra, int $year): void
    {
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        abort_unless(SchoolClass::where(['id' => $data['class_id'], 'kod_sekolah' => $data['kod_sekolah'], 'tahun' => $year, 'tahun_akademik' => $data['tahun_akademik']])->exists(), 422, 'Kelas tidak sepadan dengan modul.');
        abort_unless(Student::where(['id' => $data['student_id'], 'class_id' => $data['class_id'], 'kod_sekolah' => $data['kod_sekolah'], 'status' => 'AKTIF'])->exists(), 422, 'Murid tidak sepadan dengan kelas.');
        $key = ['tahun_akademik' => $data['tahun_akademik'], 'student_id' => $data['student_id'], ...$extra];
        $id = DB::table($table)->where($key)->value('id') ?? (string) Str::uuid();
        DB::table($table)->updateOrInsert(['id' => $id], [...$data, ...$extra, 'entered_by' => $request->user()->id, 'updated_by' => $request->user()->id, 'created_at' => now(), 'updated_at' => now()]);
    }

    private function codes(Request $request)
    {
        $user = $request->user();
        if (in_array($user->role, ['OWNER', 'ADMIN_DAERAH'], true)) return null;
        if ($user->role === 'ADMIN_ZON') return \App\Models\School::where('zon', $user->zon)->pluck('kod_sekolah');
        return collect([$user->kod_sekolah]);
    }

    private function classes(Request $request, int $year)
    {
        $query = SchoolClass::where('tahun', $year)->where('status', 'AKTIF')->orderBy('kod_sekolah')->orderBy('nama_kelas');
        if (($codes = $this->codes($request)) !== null) $query->whereIn('kod_sekolah', $codes);
        return $query->get();
    }

    private function students(Request $request, int $year)
    {
        $query = Student::where('status', 'AKTIF')->whereHas('class', fn ($class) => $class->where('tahun', $year))->orderBy('nama');
        if (($codes = $this->codes($request)) !== null) $query->whereIn('kod_sekolah', $codes);
        return $query->get();
    }
}
