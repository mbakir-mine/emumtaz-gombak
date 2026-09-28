<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\RateLimiter;
use App\Models\User;

class AuthenticatedSessionController extends Controller
{
    public function apiProfile(Request $request)
    {
        $data = $request->validate(['nama' => ['required', 'string', 'max:180']]);
        $user = $request->user();
        abort_unless($user, 401);
        $user->update(['name' => strtoupper(trim(preg_replace('/\s+/', ' ', $data['nama'] ?? '')))]);
        return response()->json(['ok' => true, 'user' => $user->fresh()]);
    }
    public function apiRegister(Request $request)
    {
        $email = strtolower(trim((string) $request->input('email')));
        $key = 'register:'.$request->ip().':'.$email;
        if (RateLimiter::tooManyAttempts($key, 5)) return response()->json(['message' => 'Terlalu banyak percubaan pendaftaran. Sila cuba lagi kemudian.'], 429);
        RateLimiter::hit($key, 3600);
        $data = $request->validate(['nama' => ['required', 'string', 'max:120'], 'email' => ['required', 'email', 'max:254', 'unique:users,email'], 'password' => ['required', 'string', 'min:8', 'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/\d/', 'regex:/[^A-Za-z0-9]/'], 'role' => ['required', 'in:ADMIN_DAERAH,ADMIN_ZON,ADMIN_SEKOLAH,GURU_KELAS,GURU_SUBJEK'], 'kod_sekolah' => ['nullable', 'exists:schools,kod_sekolah'], 'zon' => ['nullable', 'in:BARAT,TIMUR,TENGAH']]);
        if (in_array($data['role'], ['ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'], true) && empty($data['kod_sekolah'])) return response()->json(['message' => 'Sekolah diperlukan.'], 422);
        if ($data['role'] === 'ADMIN_ZON' && empty($data['zon'])) return response()->json(['message' => 'Zon diperlukan.'], 422);
        $user = User::query()->create(['id' => (string) Str::uuid(), 'name' => strtoupper($data['nama']), 'email' => strtolower($data['email']), 'password' => $data['password'], 'role' => $data['role'], 'kod_sekolah' => in_array($data['role'], ['ADMIN_DAERAH', 'ADMIN_ZON'], true) ? null : ($data['kod_sekolah'] ?? null), 'zon' => $data['role'] === 'ADMIN_ZON' ? $data['zon'] : null, 'status' => 'MENUNGGU', 'must_change_password' => false]);
        return response()->json(['ok' => true, 'id' => $user->id], 201);
    }

    public function apiLogin(Request $request)
    {
        $credentials = $request->validate(['email' => ['required', 'email', 'max:254'], 'password' => ['required', 'string']]);
        if (! Auth::attempt(['email' => strtolower($credentials['email']), 'password' => $credentials['password'], 'status' => 'AKTIF'])) {
            return response()->json(['message' => 'Email atau password tidak sah.'], 401);
        }
        $request->session()->regenerate();
        $request->session()->put('login_at', now()->toIso8601String());
        $this->recordActivity($request, 'LOGIN');
        return response()->json(['ok' => true, 'user' => $request->user()]);
    }

    public function apiSession(Request $request)
    {
        $user = $request->user();
        if (! $user) return response()->json(['authenticated' => false, 'user' => null]);
        $license = $user->kod_sekolah ? DB::table('school_licenses')->where('kod_sekolah', $user->kod_sekolah)->first(['plan_code', 'status', 'starts_on', 'ends_on']) : null;
        $modules = $user->kod_sekolah ? DB::table('school_module_access')->where('kod_sekolah', $user->kod_sekolah)->where('enabled', true)->pluck('module_key')->values()->all() : [];
        return response()->json(['authenticated' => true, 'user' => $user, 'license' => $license, 'enabled_modules' => $modules]);
    }

    public function apiLogout(Request $request)
    {
        if ($request->user()) $this->recordActivity($request, 'LOGOUT');
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['ok' => true]);
    }

    public function create(): View
    {
        return view('auth.login');
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email', 'max:254'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt([
            'email' => strtolower($credentials['email']),
            'password' => $credentials['password'],
            'status' => 'AKTIF',
        ], $request->boolean('remember'))) {
            DB::table('auth_login_failure_logs')->insert([
                'created_at' => now(),
                'identifier_hash' => hash_hmac('sha256', strtolower($credentials['email']), (string) config('app.key')),
                'network_hash' => hash_hmac('sha256', (string) $request->ip(), (string) config('app.key')),
                'device_family' => 'UNKNOWN',
            ]);
            return back()->withErrors(['email' => 'Email atau password tidak sah.'])->onlyInput('email');
        }

        $request->session()->regenerate();
        $request->session()->put('login_at', now()->toIso8601String());
        $this->recordActivity($request, 'LOGIN');

        return redirect()->intended('/dashboard');
    }

    public function destroy(Request $request): RedirectResponse
    {
        if ($request->user()) $this->recordActivity($request, 'LOGOUT');
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }

    private function recordActivity(Request $request, string $event): void
    {
        $user = $request->user();
        if (! $user) return;
        DB::table('auth_activity_logs')->insert([
            'created_at' => now(), 'actor_auth_user_id' => $user->id, 'actor_email' => $user->email,
            'actor_profile_id' => $user->id, 'actor_name' => $user->name, 'actor_role' => $user->role,
            'kod_sekolah' => $user->kod_sekolah, 'event_type' => $event,
            'session_id' => $request->session()->getId(),
        ]);
    }
}
