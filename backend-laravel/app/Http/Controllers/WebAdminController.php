<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\View\View;

class WebAdminController extends Controller
{
    private function schoolCodes(Request $request)
    {
        $user = $request->user();
        if (in_array($user->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN], true)) return null;
        if ($user->role === \App\Models\User::ZONE_ADMIN) return School::where('zon', $user->zon)->pluck('kod_sekolah');
        return collect([$user->kod_sekolah]);
    }

    public function schools(Request $request): View
    {
        $codes = $this->schoolCodes($request);
        $query = School::orderBy('nama_sekolah');
        if ($codes !== null) $query->whereIn('kod_sekolah', $codes);
        return view('admin.schools', ['schools' => $query->get()]);
    }

    public function classes(Request $request): View
    {
        $codes = $this->schoolCodes($request);
        $query = SchoolClass::with('school')->orderBy('kod_sekolah')->orderBy('tahun')->orderBy('nama_kelas');
        if ($codes !== null) $query->whereIn('kod_sekolah', $codes);
        return view('admin.classes', ['classes' => $query->get()]);
    }

    public function students(Request $request): View
    {
        $codes = $this->schoolCodes($request);
        $query = Student::with('class')->orderBy('kod_sekolah')->orderBy('nama');
        if ($codes !== null) $query->whereIn('kod_sekolah', $codes);
        return view('admin.students', ['students' => $query->paginate(50)]);
    }

    public function storeSchool(Request $request)
    {
        abort_unless(in_array($request->user()->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN], true), 403);
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'max:32', 'unique:schools,kod_sekolah'], 'nama_sekolah' => ['required', 'string', 'max:180'], 'daerah' => ['nullable', 'string', 'max:100'], 'zon' => ['nullable', 'in:BARAT,TIMUR,TENGAH']]);
        School::create(['id' => (string) Str::uuid(), ...$data, 'kategori' => 'KAFAI', 'status' => 'AKTIF']);
        return redirect()->route('admin.schools')->with('status', 'Sekolah berjaya ditambah.');
    }

    public function storeClass(Request $request)
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'exists:schools,kod_sekolah'], 'tahun_akademik' => ['required', 'integer', 'between:2000,2100'], 'tahun' => ['required', 'integer', 'between:1,6'], 'nama_kelas' => ['required', 'string', 'max:120'], 'sesi' => ['nullable', 'string', 'max:20']]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        abort_if(SchoolClass::where($data)->exists(), 422, 'Kelas tersebut sudah wujud.');
        SchoolClass::create(['id' => (string) Str::uuid(), ...$data, 'status' => 'AKTIF']);
        return redirect()->route('admin.classes')->with('status', 'Kelas berjaya ditambah.');
    }

    public function storeStudent(Request $request)
    {
        $data = $request->validate(['mykid' => ['required', 'max:32', 'unique:students,mykid'], 'nama' => ['required', 'max:180'], 'kod_sekolah' => ['required', 'exists:schools,kod_sekolah'], 'class_id' => ['nullable', 'uuid', 'exists:classes,id'], 'tahun_akademik' => ['nullable', 'integer', 'between:2000,2100']]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        if (!empty($data['class_id'])) abort_unless(SchoolClass::whereKey($data['class_id'])->where('kod_sekolah', $data['kod_sekolah'])->exists(), 422, 'Kelas tidak sepadan dengan sekolah.');
        Student::create(['id' => (string) Str::uuid(), ...$data, 'status' => 'AKTIF']);
        return redirect()->route('admin.students')->with('status', 'Murid berjaya ditambah.');
    }
}
