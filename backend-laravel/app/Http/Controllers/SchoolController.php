<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SchoolController extends Controller
{
    public function publicIndex(): JsonResponse
    {
        return response()->json(['data' => School::query()->where('status', 'AKTIF')->orderBy('kod_sekolah')->get(['kod_sekolah', 'nama_sekolah'])]);
    }

    public function updateZone(Request $request, string $schoolCode): JsonResponse
    {
        abort_unless(in_array($request->user()->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN], true), 403);
        $data = $request->validate(['zon' => ['nullable', 'in:BARAT,TIMUR,TENGAH']]);
        $school = School::query()->where('kod_sekolah', $schoolCode)->firstOrFail();
        $school->update(['zon' => $data['zon'] ?? null]);
        return response()->json(['data' => $school->fresh()]);
    }
    public function index(Request $request): JsonResponse
    {
        $query = School::query()->where('status', 'AKTIF')->orderBy('nama_sekolah');
        if ($request->user()->role === \App\Models\User::ZONE_ADMIN) {
            $query->where('zon', $request->user()->zon);
        } elseif (! in_array($request->user()->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN], true)) {
            $query->where('kod_sekolah', $request->user()->kod_sekolah);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless(in_array($request->user()->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN], true), 403);
        $data = $request->validate([
            'kod_sekolah' => ['required', 'string', 'max:32', 'unique:schools,kod_sekolah'],
            'nama_sekolah' => ['required', 'string', 'max:180'],
            'kategori' => ['nullable', 'string', 'max:32'],
            'daerah' => ['nullable', 'string', 'max:100'],
            'zon' => ['nullable', 'in:BARAT,TIMUR,TENGAH'],
        ]);
        $school = School::query()->create(array_merge($data, [
            'id' => (string) Str::uuid(),
            'kategori' => $data['kategori'] ?? 'KAFAI',
            'status' => 'AKTIF',
        ]));

        return response()->json(['data' => $school], 201);
    }
}
