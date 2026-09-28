<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\View\View;

class ParentPortalController extends Controller
{
    private const COOKIE = 'emumtaz_parent_session';

    public function loginPage(): View
    {
        return view('parent.login');
    }

    public function login(Request $request)
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'max:32'], 'mykid' => ['required', 'string', 'max:32'], 'code' => ['required', 'string', 'size:8']]);
        $student = Student::where(['kod_sekolah' => $data['kod_sekolah'], 'mykid' => $data['mykid'], 'status' => 'AKTIF'])->first();
        $match = $student ? DB::table('parent_access_codes')->where(['student_id' => $student->id, 'status' => 'AKTIF'])->where('expires_at', '>', now())->get()->first(fn ($row) => hash_equals($row->code_hash, $this->digest($student->kod_sekolah.':'.$student->id.':'.strtoupper($data['code'])))) : null;
        if (! $match) return back()->withErrors(['code' => 'Maklumat akses tidak sah.'])->withInput($request->except('code'));
        $raw = Str::random(64);
        $expires = min($match->expires_at, now()->addMinutes(30));
        DB::table('parent_access_sessions')->insert(['id' => (string) Str::uuid(), 'access_code_id' => $match->id, 'student_id' => $student->id, 'kod_sekolah' => $student->kod_sekolah, 'token_hash' => $this->digest($raw), 'expires_at' => $expires, 'created_at' => now(), 'updated_at' => now()]);
        return redirect()->route('parent.portal')->cookie(self::COOKIE, $raw, 30, '/', null, true, true, false, 'lax');
    }

    public function portal(Request $request): View
    {
        $session = $this->session($request);
        abort_unless($session, 401);
        $student = Student::findOrFail($session->student_id);
        $marks = DB::table('marks')->where('student_id', $student->id)->orderBy('kod_subjek')->get();
        return view('parent.portal', compact('student', 'marks'));
    }

    public function logout(Request $request)
    {
        if ($session = $this->session($request)) DB::table('parent_access_sessions')->where('id', $session->id)->update(['revoked_at' => now()]);
        return redirect()->route('parent.login')->withoutCookie(self::COOKIE);
    }

    private function session(Request $request): ?object
    {
        $raw = $request->cookie(self::COOKIE);
        return $raw ? DB::table('parent_access_sessions')->where('token_hash', $this->digest($raw))->whereNull('revoked_at')->where('expires_at', '>', now())->first() : null;
    }

    private function digest(string $value): string
    {
        return hash_hmac('sha256', $value, (string) config('app.key'));
    }
}
