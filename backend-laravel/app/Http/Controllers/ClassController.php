<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClassController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SchoolClass::query()->where('status', 'AKTIF')->orderBy('tahun')->orderBy('nama_kelas');
        $user = $request->user();
        if (! in_array($user->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN], true)) {
            if ($user->role === \App\Models\User::ZONE_ADMIN) {
                $schoolCodes = \App\Models\School::query()->where('zon', $user->zon)->where('status', 'AKTIF')->pluck('kod_sekolah');
                $query->whereIn('kod_sekolah', $schoolCodes);
            } else {
                $query->where('kod_sekolah', $user->kod_sekolah);
            }
        }
        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kod_sekolah' => ['required', 'string', 'max:32', 'exists:schools,kod_sekolah'],
            'tahun_akademik' => ['required', 'integer', 'between:2000,2100'],
            'tahun' => ['required', 'integer', 'between:1,6'],
            'nama_kelas' => ['required', 'string', 'max:120'],
            'sesi' => ['nullable', 'string', 'max:20'],
        ]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        abort_if(SchoolClass::query()->where($data)->exists(), 422, 'Kelas untuk tahun akademik ini sudah wujud.');
        $class = SchoolClass::query()->create(array_merge($data, ['id' => (string) Str::uuid(), 'status' => 'AKTIF']));
        return response()->json(['data' => $class], 201);
    }
}
