<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CharacterAssessmentController extends Controller
{
    public function khalifahRecords(Request $request): JsonResponse
    {
        $query = DB::table('khalifah_muda_records as r')->leftJoin('students as s', 's.id', '=', 'r.student_id')->select('r.*', 's.nama_murid')->latest('r.record_date');
        if (! $request->user()->roleIsAdministrative()) $query->where('r.kod_sekolah', $request->user()->kod_sekolah);
        return response()->json(['data' => $query->limit(5000)->get()]);
    }

    public function khalifahComponents(Request $request): JsonResponse
    {
        return response()->json(['data' => DB::table('khalifah_muda_components')->where('status', 'AKTIF')->orderBy('sort_order')->get()]);
    }

    public function sahsiahRecords(Request $request): JsonResponse
    {
        $query = DB::table('sahsiah_ihab_assessments as a')->leftJoin('students as s', 's.id', '=', 'a.student_id')->select('a.*', 's.nama_murid')->latest('a.updated_at');
        if (! $request->user()->roleIsAdministrative()) $query->where('a.kod_sekolah', $request->user()->kod_sekolah);
        return response()->json(['data' => $query->limit(5000)->get()]);
    }

    public function component(Request $request): JsonResponse
    {
        abort_unless($request->user()->roleIsAdministrative(), 403);
        $data = $request->validate(['id' => ['nullable', 'uuid'], 'kind' => ['required', 'in:AKTIVITI_KELAS,POSITIF,BIMBINGAN'], 'label' => ['required', 'string', 'max:180'], 'domain' => ['required', 'string', 'max:100'], 'key' => ['required', 'string', 'max:100'], 'points' => ['required', 'numeric', 'between:0,100'], 'sort_order' => ['required', 'integer', 'min:0'], 'status' => ['required', 'in:AKTIF,DINYAHTIF']]);
        $id = $data['id'] ?? (string) Str::uuid(); unset($data['id']); $data['updated_at'] = now(); $data['created_at'] = now();
        DB::table('khalifah_muda_components')->updateOrInsert(['id' => $id], $data);
        return response()->json(['data' => ['id' => $id]], $request->input('id') ? 200 : 201);
    }

    public function khalifah(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'max:40'], 'class_id' => ['required', 'uuid', 'exists:classes,id'], 'student_id' => ['nullable', 'uuid', 'exists:students,id'], 'record_date' => ['required', 'date'], 'record_scope' => ['required', 'in:KELAS,INDIVIDU'], 'record_kind' => ['required', 'in:AKTIVITI_KELAS,POSITIF,BIMBINGAN'], 'domain' => ['required', 'max:100'], 'indicator_key' => ['required', 'max:100'], 'indicator_label' => ['required', 'max:180'], 'points' => ['required', 'numeric', 'min:0', 'max:100'], 'catatan' => ['nullable', 'string']]);
        $this->assertScope($request, $data);
        abort_unless(DB::table('school_module_access')->where(['kod_sekolah' => $data['kod_sekolah'], 'module_key' => 'KHALIFAH_MUDA', 'enabled' => true])->exists(), 422, 'Modul Sahsiah IHAB belum diaktifkan.');
        abort_unless((int) DB::table('classes')->where('id', $data['class_id'])->value('tahun') === 6, 422, 'Modul Khalifah Muda hanya untuk Tahun 6.');
        abort_unless($data['record_scope'] === 'KELAS' || !empty($data['student_id']), 422, 'Murid diperlukan untuk rekod individu.');
        $data['id'] = (string) Str::uuid(); $data['recorded_by'] = $request->user()->id; $data['status'] = 'AKTIF'; $data['created_at'] = now(); $data['updated_at'] = now();
        DB::table('khalifah_muda_records')->insert($data);
        return response()->json(['data' => $data], 201);
    }

    public function sahsiah(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'max:40'], 'tahun_akademik' => ['required', 'integer'], 'bulan' => ['required', 'integer', 'between:1,12'], 'class_id' => ['required', 'uuid', 'exists:classes,id'], 'student_id' => ['required', 'uuid', 'exists:students,id'], 'm1_confirmed' => ['boolean'], 'm2_confirmed' => ['boolean'], 'm3_raw' => ['required', 'integer', 'between:0,320'], 'm3_percent' => ['required', 'numeric', 'between:0,100'], 'm4' => ['required', 'integer', 'between:0,16'], 'm5' => ['required', 'integer', 'between:0,100'], 'm6' => ['required', 'integer', 'between:0,100'], 'total_score' => ['required', 'numeric', 'between:0,100'], 'grade' => ['required', 'max:40'], 'band' => ['required', 'integer', 'between:1,6'], 'status' => ['sometimes', 'in:DRAF,DIHANTAR,DISAHKAN,DIPULANGKAN,DIKUNCI'], 'catatan' => ['nullable', 'string']]);
        $this->assertScope($request, $data);
        abort_unless(DB::table('school_module_access')->where(['kod_sekolah' => $data['kod_sekolah'], 'module_key' => 'KHALIFAH_MUDA', 'enabled' => true])->exists(), 422, 'Modul Sahsiah IHAB belum diaktifkan untuk sekolah ini.');
        $existing = DB::table('sahsiah_ihab_assessments')->where(['kod_sekolah' => $data['kod_sekolah'], 'tahun_akademik' => $data['tahun_akademik'], 'bulan' => $data['bulan'], 'student_id' => $data['student_id']])->value('id');
        $id = $existing ?? (string) Str::uuid(); $data['id'] = $id; $data['status'] = $data['status'] ?? 'DRAF'; $data['updated_at'] = now(); if (!$existing) $data['created_at'] = now();
        DB::table('sahsiah_ihab_assessments')->updateOrInsert(['id' => $id], $data);
        return response()->json(['data' => DB::table('sahsiah_ihab_assessments')->where('id', $id)->first()], 201);
    }

    private function assertScope(Request $request, array $data): void
    {
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        abort_unless(DB::table('classes')->where(['id' => $data['class_id'], 'kod_sekolah' => $data['kod_sekolah']])->exists(), 422, 'Kelas tidak sepadan dengan sekolah.');
        if (!empty($data['student_id'])) abort_unless(DB::table('students')->where(['id' => $data['student_id'], 'class_id' => $data['class_id'], 'kod_sekolah' => $data['kod_sekolah'], 'status' => 'AKTIF'])->exists(), 422, 'Murid tidak sepadan dengan kelas.');
    }
}
