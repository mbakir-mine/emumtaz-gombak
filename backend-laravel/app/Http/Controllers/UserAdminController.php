<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\View\View;
use Illuminate\Http\JsonResponse;

class UserAdminController extends Controller
{
    public function apiCreate(Request $request): JsonResponse
    {
        abort_unless(in_array($request->user()->role, [User::OWNER, User::DISTRICT_ADMIN, User::SCHOOL_ADMIN], true), 403);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'email' => ['required', 'email', 'max:254', 'unique:users,email'],
            'role' => ['required', 'in:ADMIN_DAERAH,ADMIN_ZON,ADMIN_SEKOLAH,GURU_KELAS,GURU_SUBJEK'],
            'kod_sekolah' => ['nullable', 'exists:schools,kod_sekolah'],
            'zon' => ['nullable', 'in:BARAT,TIMUR,TENGAH'],
        ]);
        if ($request->user()->role === User::SCHOOL_ADMIN) {
            abort_unless($data['kod_sekolah'] === $request->user()->kod_sekolah, 403);
            abort_unless(in_array($data['role'], [User::CLASS_TEACHER, User::SUBJECT_TEACHER], true), 403);
        }
        $user = User::create([
            'id' => (string) Str::uuid(), 'name' => $data['name'], 'email' => strtolower($data['email']),
            'password' => Hash::make(Str::random(32)), 'role' => $data['role'],
            'kod_sekolah' => $data['kod_sekolah'] ?? null, 'zon' => $data['zon'] ?? null,
            'status' => 'MENUNGGU', 'must_change_password' => false,
        ]);
        return response()->json(['data' => $user], 201);
    }

    public function apiDelete(Request $request, string $userId): JsonResponse
    {
        abort_unless($request->user()->role === User::OWNER, 403);
        $target = User::query()->findOrFail($userId);
        abort_if($target->role === User::OWNER, 403);
        $target->delete();
        return response()->json(['ok' => true]);
    }

    public function apiResetPassword(Request $request, string $userId): JsonResponse
    {
        abort_unless($request->user()->role === User::OWNER, 403);
        $target = User::query()->findOrFail($userId);
        abort_if($target->role === User::OWNER || $target->status !== 'AKTIF', 422, 'Hanya pengguna aktif boleh direset.');
        $temporary = Str::password(16, true, true, false, false);
        $target->update(['password' => Hash::make($temporary), 'must_change_password' => true]);
        return response()->json(['temporary_password' => $temporary]);
    }

    public function apiIndex(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless(in_array($user->role, [User::OWNER, User::DISTRICT_ADMIN, User::ZONE_ADMIN, User::SCHOOL_ADMIN], true), 403);
        $query = User::query()->where('role', '!=', User::OWNER)->orderBy('name');
        if (! in_array($user->role, [User::OWNER, User::DISTRICT_ADMIN], true)) $query->where('kod_sekolah', $user->kod_sekolah);
        return response()->json(['data' => $query->get()->map(fn (User $item): array => ['id' => $item->id, 'email' => $item->email, 'nama' => $item->name, 'role' => $item->role, 'kod_sekolah' => $item->kod_sekolah, 'zon' => $item->zon, 'status' => $item->status, 'allowed_nav' => $item->allowed_nav])]);
    }

    public function apiStatus(Request $request, string $userId): JsonResponse
    {
        $target = User::query()->findOrFail($userId);
        abort_unless($request->user()->role === User::OWNER && $target->role !== User::OWNER, 403);
        $data = $request->validate(['status' => ['required', 'in:AKTIF,MENUNGGU,DIGANTUNG']]);
        $target->update(['status' => $data['status']]);
        return response()->json(['data' => $target->fresh()]);
    }

    public function apiActivate(Request $request, string $userId): JsonResponse
    {
        abort_unless($request->user()->role === User::OWNER, 403);
        $target = User::query()->findOrFail($userId);
        abort_if($target->role === User::OWNER, 403);
        $temporary = Str::password(16, true, true, false, false);
        $target->update(['status' => 'AKTIF', 'password' => Hash::make($temporary), 'must_change_password' => true]);
        return response()->json(['data' => $target->fresh(), 'temporary_password' => $temporary]);
    }

    public function apiUpdate(Request $request, string $userId): JsonResponse
    {
        abort_unless($request->user()->role === User::OWNER, 403);
        $target = User::query()->findOrFail($userId);
        abort_if($target->role === User::OWNER, 403);
        $data = $request->validate(['role' => ['required', 'in:ADMIN_DAERAH,ADMIN_ZON,ADMIN_SEKOLAH,GURU_KELAS,GURU_SUBJEK'], 'status' => ['required', 'in:AKTIF,MENUNGGU,DIGANTUNG'], 'zon' => ['nullable', 'in:BARAT,TIMUR,TENGAH'], 'kod_sekolah' => ['nullable', 'exists:schools,kod_sekolah'], 'allowed_nav' => ['nullable', 'array']]);
        if ($data['role'] === User::ZONE_ADMIN && empty($data['zon'])) abort(422, 'Zon diperlukan untuk Admin Zon.');
        if (in_array($data['role'], [User::DISTRICT_ADMIN, User::ZONE_ADMIN], true)) { $data['kod_sekolah'] = null; }
        if ($data['role'] === User::DISTRICT_ADMIN) $data['zon'] = null;
        $target->update($data);
        return response()->json(['data' => $target->fresh()]);
    }

    public function index(Request $request): View
    {
        $user = $request->user();
        $query = User::orderBy('name');
        if (!in_array($user->role, [User::OWNER, User::DISTRICT_ADMIN], true)) $query->where('kod_sekolah', $user->kod_sekolah);
        return view('admin.users', ['users' => $query->get(), 'schools' => $user->role === User::OWNER ? School::where('status', 'AKTIF')->orderBy('nama_sekolah')->get() : collect()]);
    }

    public function store(Request $request)
    {
        abort_unless(in_array($request->user()->role, [User::OWNER, User::DISTRICT_ADMIN, User::SCHOOL_ADMIN], true), 403);
        $data = $request->validate(['name' => ['required', 'string', 'max:180'], 'email' => ['required', 'email', 'max:254', 'unique:users,email'], 'password' => ['required', 'string', 'min:12'], 'role' => ['required', 'in:OWNER,ADMIN_DAERAH,ADMIN_ZON,ADMIN_SEKOLAH,GURU_KELAS,GURU_SUBJEK'], 'kod_sekolah' => ['nullable', 'exists:schools,kod_sekolah'], 'daerah' => ['nullable', 'max:100'], 'zon' => ['nullable', 'in:BARAT,TIMUR,TENGAH']]);
        if ($request->user()->role === User::SCHOOL_ADMIN) {
            abort_unless($data['kod_sekolah'] === $request->user()->kod_sekolah, 403);
            abort_unless(in_array($data['role'], [User::CLASS_TEACHER, User::SUBJECT_TEACHER], true), 403);
        }
        if ($request->user()->role === User::DISTRICT_ADMIN) {
            abort_unless($data['role'] !== User::OWNER, 403);
        }
        User::create(['id' => (string) Str::uuid(), 'name' => $data['name'], 'email' => strtolower($data['email']), 'password' => Hash::make($data['password']), 'role' => $data['role'], 'kod_sekolah' => $data['kod_sekolah'] ?? null, 'daerah' => $data['daerah'] ?? null, 'zon' => $data['zon'] ?? null, 'status' => 'AKTIF']);
        return redirect()->route('admin.users')->with('status', 'Pengguna berjaya ditambah.');
    }
}
