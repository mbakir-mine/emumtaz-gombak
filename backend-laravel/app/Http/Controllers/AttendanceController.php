<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AttendanceController extends Controller
{
    public function context(Request $request): JsonResponse
    {
        $user = $request->user();
        $classQuery = \App\Models\SchoolClass::query()->where('status', 'AKTIF');
        if (!in_array($user->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN], true)) {
            $classQuery->where('kod_sekolah', $user->kod_sekolah);
        }
        if ($user->role === \App\Models\User::CLASS_TEACHER) {
            $classQuery->whereIn('id', DB::table('teacher_class_assignments')->where('user_id', $user->id)->pluck('class_id'));
        }
        $classes = $classQuery->orderBy('kod_sekolah')->orderBy('nama_kelas')->get(['id', 'kod_sekolah', 'tahun', 'tahun_akademik', 'nama_kelas', 'status']);
        $classIds = $classes->pluck('id');
        $students = \App\Models\Student::query()->whereIn('class_id', $classIds)->where('status', 'AKTIF')->orderBy('nama')->get(['id', 'class_id', 'kod_sekolah', 'mykid', 'nama', 'jantina']);
        $date = $request->date('attendance_date')?->format('Y-m-d') ?? now()->format('Y-m-d');
        $records = DB::table('daily_attendance')->whereIn('class_id', $classIds)->where('attendance_date', $date)->get(['student_id', 'class_id', 'attendance_date', 'status', 'catatan']);
        return response()->json(['classes' => $classes, 'students' => $students, 'attendance' => $records, 'attendance_date' => $date]);
    }

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate(['class_id' => ['nullable', 'uuid', 'exists:classes,id'], 'attendance_date' => ['nullable', 'date']]);
        $class = !empty($data['class_id']) ? \App\Models\SchoolClass::query()->findOrFail($data['class_id']) : null;
        if ($class) {
            abort_unless($request->user()->canAccessSchool($class->kod_sekolah), 403);
            if ($request->user()->role === \App\Models\User::CLASS_TEACHER) abort_unless(DB::table('teacher_class_assignments')->where(['user_id' => $request->user()->id, 'class_id' => $class->id])->exists(), 403);
        }
        $query = DB::table('daily_attendance')->when($class, fn ($q) => $q->where('class_id', $class->id))->when($data['attendance_date'] ?? null, fn ($q, $date) => $q->where('attendance_date', $date));
        return response()->json(['data' => $query->orderByDesc('attendance_date')->limit(500)->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'class_id' => ['required', 'uuid', 'exists:classes,id'],
            'attendance_date' => ['required', 'date'],
            'records' => ['required', 'array', 'min:1', 'max:100'],
            'records.*.student_id' => ['required', 'uuid', 'exists:students,id'],
            'records.*.status' => ['required', 'in:HADIR,TIDAK_HADIR,SAKIT,CUTI,LEWAT,AKTIVITI,BERCUTI'],
            'records.*.catatan' => ['nullable', 'string', 'max:255'],
        ]);
        $class = \App\Models\SchoolClass::query()->findOrFail($data['class_id']);
        abort_unless($request->user()->canAccessSchool($class->kod_sekolah), 403);
        $role = $request->user()->role;
        if ($role === \App\Models\User::CLASS_TEACHER && ! DB::table('teacher_class_assignments')->where(['user_id' => $request->user()->id, 'class_id' => $class->id])->exists()) {
            abort(403, 'Guru kelas tidak ditugaskan kepada kelas ini.');
        }
        $now = now();
        $rows = collect($data['records'])->map(function (array $record) use ($class, $data, $request, $now): array {
            $student = \App\Models\Student::query()->findOrFail($record['student_id']);
            abort_unless($student->kod_sekolah === $class->kod_sekolah && $student->class_id === $class->id, 422, 'Murid tidak sepadan dengan kelas.');
            return [
                'id' => (string) Str::uuid(), 'student_id' => $student->id, 'class_id' => $class->id,
                'kod_sekolah' => $class->kod_sekolah, 'attendance_date' => $data['attendance_date'],
                'status' => $record['status'], 'catatan' => $record['catatan'] ?? null,
                'recorded_by' => $request->user()->id, 'created_at' => $now, 'updated_at' => $now,
            ];
        })->all();
        DB::table('daily_attendance')->upsert($rows, ['student_id', 'attendance_date'], ['class_id', 'kod_sekolah', 'status', 'catatan', 'recorded_by', 'updated_at']);
        return response()->json(['ok' => true, 'count' => count($rows)]);
    }
}
