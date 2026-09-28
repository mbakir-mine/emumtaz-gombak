<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ParentAccessController extends Controller
{
    private const COOKIE = 'emumtaz_parent_session';

    public function issue(Request $request): JsonResponse
    {
        $data = $request->validate(['student_id' => ['required', 'uuid', 'exists:students,id'], 'valid_days' => ['sometimes', 'integer', 'between:1,31']]);
        $student = Student::query()->findOrFail($data['student_id']);
        abort_unless($request->user()->canAccessSchool($student->kod_sekolah), 403);
        $plain = strtoupper(Str::random(8));
        $expires = now()->addDays($data['valid_days'] ?? 7);
        $id = (string) Str::uuid();
        DB::table('parent_access_codes')->insert(['id' => $id, 'student_id' => $student->id, 'kod_sekolah' => $student->kod_sekolah, 'code_hash' => $this->digest($student->kod_sekolah.':'.$student->id.':'.$plain), 'expires_at' => $expires, 'issued_by' => $request->user()->id, 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['code' => $plain, 'expires_at' => $expires, 'message' => 'Kod penuh hanya dipaparkan sekali.'], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'max:32'], 'mykid' => ['required', 'string', 'max:32'], 'code' => ['required', 'string', 'size:8']]);
        $student = Student::query()->where(['kod_sekolah' => $data['kod_sekolah'], 'mykid' => $data['mykid'], 'status' => 'AKTIF'])->first();
        $identifierHash = $this->digest($data['kod_sekolah'].':'.$data['mykid']);
        if (! $student) {
            $this->recordParentEvent($data['kod_sekolah'], null, 'GAGAL', $identifierHash, $request);
            return response()->json(['message' => 'Maklumat akses tidak sah.'], 401);
        }
        $now = now();
        $codes = DB::table('parent_access_codes')->where(['student_id' => $student->id, 'status' => 'AKTIF'])->where('expires_at', '>', $now)->where(function ($query) use ($now) { $query->whereNull('locked_until')->orWhere('locked_until', '<=', $now); })->get();
        $match = $codes->first(fn ($code) => hash_equals($code->code_hash, $this->digest($student->kod_sekolah.':'.$student->id.':'.strtoupper($data['code']))));
        if (! $match) {
            $this->recordParentEvent($student->kod_sekolah, $student->id, 'GAGAL', $identifierHash, $request);
            return response()->json(['message' => 'Maklumat akses tidak sah.'], 401);
        }
        $raw = Str::random(64);
        $expires = min($match->expires_at, now()->addMinutes(30));
        DB::table('parent_access_sessions')->insert(['id' => (string) Str::uuid(), 'access_code_id' => $match->id, 'student_id' => $student->id, 'kod_sekolah' => $student->kod_sekolah, 'token_hash' => $this->digest($raw), 'expires_at' => $expires, 'created_at' => now(), 'updated_at' => now()]);
        $this->recordParentEvent($student->kod_sekolah, $student->id, 'BERJAYA', $identifierHash, $request);
        return response()->json(['ok' => true, 'student' => $student])->cookie(self::COOKIE, $raw, 30, '/', null, true, true, false, 'lax');
    }

    public function report(Request $request): JsonResponse
    {
        $raw = $request->cookie(self::COOKIE);
        $session = $raw ? DB::table('parent_access_sessions')->where('token_hash', $this->digest($raw))->whereNull('revoked_at')->where('expires_at', '>', now())->first() : null;
        abort_unless($session, 401);
        $student = Student::query()->findOrFail($session->student_id);
        return response()->json(['data' => ['student' => $student, 'marks' => DB::table('marks')->where('student_id', $student->id)->get()]]);
    }

    public function logout(Request $request): JsonResponse
    {
        if ($raw = $request->cookie(self::COOKIE)) {
            $session = DB::table('parent_access_sessions')->where('token_hash', $this->digest($raw))->first();
            DB::table('parent_access_sessions')->where('token_hash', $this->digest($raw))->update(['revoked_at' => now()]);
            if ($session) $this->recordParentEvent($session->kod_sekolah, $session->student_id, 'LOG_KELUAR', $this->digest($raw), $request);
        }
        return response()->json(['ok' => true])->withoutCookie(self::COOKIE);
    }

    private function digest(string $value): string
    {
        return hash_hmac('sha256', $value, (string) config('app.key'));
    }

    private function recordParentEvent(?string $school, ?string $studentId, string $type, string $identifierHash, Request $request): void
    {
        DB::table('parent_access_events')->insert([
            'kod_sekolah' => $school, 'student_id' => $studentId, 'event_type' => $type,
            'identifier_hash' => $identifierHash, 'network_hash' => $this->digest((string) $request->ip()), 'created_at' => now(),
        ]);
    }
}
