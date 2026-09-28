<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class AcademicSetupController extends Controller
{
    public function gradeRules(): JsonResponse
    {
        return response()->json(['data' => DB::table('subject_grade_rules')->where('wajib_isi', true)->orderBy('tahun')->orderBy('susunan')->get(['tahun', 'kod_subjek', 'wajib_isi'])]);
    }

    public function subjects(): JsonResponse
    {
        return response()->json(['data' => Subject::query()->where('status', 'AKTIF')->orderBy('susunan')->get()]);
    }

    public function storeSubject(Request $request): JsonResponse
    {
        abort_unless(in_array($request->user()->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN, \App\Models\User::SCHOOL_ADMIN], true), 403);
        $data = $request->validate([
            'kod_subjek' => ['required', 'string', 'max:64', 'unique:subjects,kod_subjek'],
            'nama_subjek' => ['required', 'string', 'max:180'],
            'markah_penuh' => ['required', 'numeric', 'gt:0', 'max:9999'],
            'dikira_purata' => ['sometimes', 'boolean'],
            'susunan' => ['sometimes', 'integer', 'min:1', 'max:9999'],
        ]);
        $subject = Subject::query()->create(array_merge($data, ['id' => (string) Str::uuid(), 'status' => 'AKTIF']));
        return response()->json(['data' => $subject], 201);
    }

    public function exams(): JsonResponse
    {
        return response()->json(['data' => Exam::query()->orderByDesc('tahun_akademik')->orderBy('kod_peperiksaan')->get()]);
    }

    public function storeExam(Request $request): JsonResponse
    {
        abort_unless(in_array($request->user()->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN, \App\Models\User::SCHOOL_ADMIN], true), 403);
        $data = $request->validate([
            'kod_peperiksaan' => ['required', 'string', 'max:64'],
            'nama_peperiksaan' => ['required', 'string', 'max:180'],
            'tahun_akademik' => ['required', 'integer', 'between:2000,2100'],
            'status' => ['sometimes', 'in:DIBUKA,DITUTUP,DRAF'],
            'tarikh_mula' => ['nullable', 'date'],
            'tarikh_tamat' => ['nullable', 'date', 'after_or_equal:tarikh_mula'],
        ]);
        abort_if(Exam::query()->where('kod_peperiksaan', $data['kod_peperiksaan'])->where('tahun_akademik', $data['tahun_akademik'])->exists(), 422, 'Kod peperiksaan untuk tahun ini sudah wujud.');
        $exam = Exam::query()->create(array_merge($data, ['id' => (string) Str::uuid(), 'status' => $data['status'] ?? 'DRAF']));
        return response()->json(['data' => $exam], 201);
    }

    public function updateExamAccess(Request $request, string $id): JsonResponse
    {
        abort_unless(in_array($request->user()->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN, \App\Models\User::SCHOOL_ADMIN], true), 403);
        $data = $request->validate(['buka_markah' => ['nullable', 'date'], 'tutup_markah' => ['nullable', 'date', 'after_or_equal:buka_markah'], 'status' => ['required', 'in:DIBUKA,DITUTUP']]);
        $exam = Exam::query()->findOrFail($id);
        $exam->update($data);
        return response()->json(['data' => $exam->fresh()]);
    }
}
