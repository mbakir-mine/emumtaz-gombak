<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MarkSettingsController extends Controller
{
    public function index(Request $request, string $kind): JsonResponse
    {
        $tables = [
            'components' => 'subject_component_mark_settings',
            'subjects' => 'school_subject_mark_settings',
            'school-components' => 'school_subject_component_mark_settings',
        ];
        abort_unless(isset($tables[$kind]), 404);
        $query = DB::table($tables[$kind])->where('status', 'AKTIF')->orderByDesc('tahun_akademik')->orderBy('kod_peperiksaan')->orderBy('tahun')->orderBy('kod_subjek');
        $user = $request->user();
        if (! $user->roleIsAdministrative()) $query->where('kod_sekolah', $user->kod_sekolah);
        return response()->json(['data' => $query->get()]);
    }

    public function school(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'max:40'], 'tahun_akademik' => ['required', 'integer'], 'kod_peperiksaan' => ['required', 'string', 'max:40'], 'tahun' => ['required', 'integer', 'between:1,6'], 'subjects' => ['array'], 'subjects.*.kod_subjek' => ['required', 'string'], 'subjects.*.markah_penuh' => ['required', 'numeric', 'gt:0'], 'components' => ['array'], 'components.*.kod_subjek' => ['required', 'string'], 'components.*.kod_komponen' => ['required', 'string'], 'components.*.markah_penuh' => ['required', 'numeric', 'gt:0']]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        DB::transaction(function () use ($data, $request): void {
            $scope = ['kod_sekolah' => $data['kod_sekolah'], 'tahun_akademik' => $data['tahun_akademik'], 'kod_peperiksaan' => $data['kod_peperiksaan'], 'tahun' => $data['tahun']];
            DB::table('school_subject_mark_settings')->where($scope)->update(['status' => 'DIBUANG', 'updated_at' => now()]);
            DB::table('school_subject_component_mark_settings')->where($scope)->update(['status' => 'DIBUANG', 'updated_at' => now()]);
            foreach ($data['subjects'] ?? [] as $row) DB::table('school_subject_mark_settings')->updateOrInsert([...$scope, 'kod_subjek' => $row['kod_subjek']], [...$row, ...$scope, 'id' => (string) Str::uuid(), 'status' => 'AKTIF', 'created_by' => $request->user()->id, 'updated_by' => $request->user()->id, 'created_at' => now(), 'updated_at' => now()]);
            foreach ($data['components'] ?? [] as $row) DB::table('school_subject_component_mark_settings')->updateOrInsert([...$scope, 'kod_subjek' => $row['kod_subjek'], 'kod_komponen' => $row['kod_komponen']], [...$row, ...$scope, 'id' => (string) Str::uuid(), 'status' => 'AKTIF', 'created_by' => $request->user()->id, 'updated_by' => $request->user()->id, 'created_at' => now(), 'updated_at' => now()]);
        });
        return response()->json(['ok' => true]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['tahun_akademik' => ['required', 'integer'], 'kod_peperiksaan' => ['required', 'string', 'max:40'], 'tahun' => ['required', 'integer', 'between:1,6'], 'rows' => ['required', 'array', 'min:1'], 'rows.*.kod_subjek' => ['required', 'string', 'max:40'], 'rows.*.kod_komponen' => ['required', 'string', 'max:40'], 'rows.*.markah_penuh' => ['required', 'numeric', 'between:0,100']]);
        $totals = collect($data['rows'])->groupBy('kod_subjek')->map(fn ($rows) => $rows->sum('markah_penuh'));
        abort_if($totals->contains(fn ($total) => abs($total - 100) > 0.001), 422, 'Jumlah komponen setiap subjek mesti tepat 100.');
        foreach ($data['rows'] as $row) DB::table('subject_component_mark_settings')->updateOrInsert(['tahun_akademik' => $data['tahun_akademik'], 'kod_peperiksaan' => $data['kod_peperiksaan'], 'tahun' => $data['tahun'], 'kod_subjek' => $row['kod_subjek'], 'kod_komponen' => $row['kod_komponen']], [...$row, 'id' => (string) Str::uuid(), 'tahun_akademik' => $data['tahun_akademik'], 'kod_peperiksaan' => $data['kod_peperiksaan'], 'tahun' => $data['tahun'], 'status' => 'AKTIF', 'updated_at' => now(), 'created_at' => now()]);
        return response()->json(['ok' => true]);
    }
}
