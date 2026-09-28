<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SchoolModuleController extends Controller
{
    private const MODULES = ['TAKWIM', 'KEHADIRAN_HARIAN', 'AMAL_KHAIR', 'JADUAL_WAKTU', 'RPH_AI', 'AKSES_IBU_BAPA', 'PELAPORAN_PBD', 'PENILAIAN_UPKK', 'KHALIFAH_MUDA', 'PERCUBAAN_PSRA', 'PERCUBAAN_UPKK'];

    public function index(Request $request): JsonResponse
    {
        $query = DB::table('school_module_access')->orderBy('kod_sekolah')->orderBy('module_key');
        $user = $request->user();
        if ($user->role === 'ADMIN_ZON') $query->whereIn('kod_sekolah', DB::table('schools')->where('zon', $user->zon)->pluck('kod_sekolah'));
        elseif (!in_array($user->role, ['OWNER', 'ADMIN_DAERAH'], true)) $query->where('kod_sekolah', $user->kod_sekolah);
        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'exists:schools,kod_sekolah'], 'module_key' => ['required', 'in:'.implode(',', self::MODULES)], 'enabled' => ['required', 'boolean'], 'catatan' => ['nullable', 'string']]);
        abort_unless(in_array($request->user()->role, ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH'], true), 403);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        $id = DB::table('school_module_access')->where(['kod_sekolah' => $data['kod_sekolah'], 'module_key' => $data['module_key']])->value('id') ?? (string) Str::uuid();
        DB::table('school_module_access')->updateOrInsert(['id' => $id], [...$data, 'enabled_at' => $data['enabled'] ? now() : null, 'enabled_by' => $request->user()->id, 'updated_at' => now(), 'created_at' => now()]);
        return response()->json(['data' => DB::table('school_module_access')->where('id', $id)->first()], 201);
    }
}
