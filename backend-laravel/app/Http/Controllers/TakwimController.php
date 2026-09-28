<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TakwimController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = DB::table('takwim_events')->where('status', 'AKTIF');
        if (!in_array($user->role, ['OWNER', 'ADMIN_DAERAH'], true)) $query->where('kod_sekolah', $user->kod_sekolah);
        return response()->json(['data' => $query->orderBy('tarikh_mula')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['tahun_akademik' => ['required', 'integer'], 'kod_sekolah' => ['nullable', 'string', 'max:40'], 'kategori' => ['required', 'string', 'max:40'], 'tajuk' => ['required', 'string', 'max:255'], 'tarikh_mula' => ['required', 'date'], 'tarikh_tamat' => ['required', 'date', 'after_or_equal:tarikh_mula'], 'keterangan' => ['nullable', 'string'], 'warna' => ['nullable', 'string', 'max:20']]);
        $user = $request->user();
        $school = $data['kod_sekolah'] ?? null;
        if ($school) abort_unless($user->canAccessSchool($school), 403);
        elseif (!in_array($user->role, ['OWNER', 'ADMIN_DAERAH'], true)) abort(403);
        $id = (string) Str::uuid();
        DB::table('takwim_events')->insert([...$data, 'id' => $id, 'scope' => $school ? 'SEKOLAH' : 'DAERAH', 'status' => 'AKTIF', 'created_by' => $user->id, 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['data' => DB::table('takwim_events')->find($id)], 201);
    }
}
