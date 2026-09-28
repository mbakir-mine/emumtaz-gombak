<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LicenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('school_licenses')->orderBy('kod_sekolah');
        $user = $request->user();
        if ($user->role === 'ADMIN_ZON') $query->whereIn('kod_sekolah', DB::table('schools')->where('zon', $user->zon)->pluck('kod_sekolah'));
        elseif (!in_array($user->role, ['OWNER', 'ADMIN_DAERAH'], true)) $query->where('kod_sekolah', $user->kod_sekolah);
        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'OWNER', 403, 'Hanya Owner boleh mengurus lesen.');
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'exists:schools,kod_sekolah'], 'plan_code' => ['required', 'in:PERCUBAAN,ASAS,PRO,PREMIER'], 'status' => ['required', 'in:PERCUBAAN,AKTIF,DIGANTUNG,TAMAT'], 'starts_on' => ['required', 'date'], 'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'], 'max_students' => ['nullable', 'integer', 'min:1'], 'max_users' => ['nullable', 'integer', 'min:1'], 'notes' => ['nullable', 'string', 'max:1000']]);
        $existing = DB::table('school_licenses')->where('kod_sekolah', $data['kod_sekolah'])->value('id');
        $id = $existing ?? (string) Str::uuid();
        DB::table('school_licenses')->updateOrInsert(['id' => $id], [...$data, 'updated_by' => $request->user()->id, 'updated_at' => now(), 'created_at' => now()]);
        return response()->json(['data' => DB::table('school_licenses')->where('id', $id)->first()], $existing ? 200 : 201);
    }
}
