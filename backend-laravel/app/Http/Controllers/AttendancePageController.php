<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class AttendancePageController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();
        $classes = SchoolClass::query()->where('status', 'AKTIF')->orderBy('kod_sekolah')->orderBy('nama_kelas');
        if (!in_array($user->role, ['OWNER', 'ADMIN_DAERAH'], true)) $classes->where('kod_sekolah', $user->kod_sekolah);
        if ($user->role === \App\Models\User::CLASS_TEACHER) {
            $classes->whereIn('id', DB::table('teacher_class_assignments')->where('user_id', $user->id)->pluck('class_id'));
        }
        $classId = $request->string('class_id')->toString();
        $date = $request->date('attendance_date')?->format('Y-m-d') ?? now()->format('Y-m-d');
        $allClasses = $classes->get();
        $selectedClass = $classId ? $allClasses->firstWhere('id', $classId) : null;
        $students = $selectedClass ? $selectedClass->students()->where('status', 'AKTIF')->orderBy('nama')->get() : collect();
        $existing = $selectedClass ? DB::table('daily_attendance')->where('class_id', $selectedClass->id)->where('attendance_date', $date)->get()->keyBy('student_id') : collect();
        return view('admin.attendance', compact('allClasses', 'selectedClass', 'students', 'existing', 'date'));
    }

    public function store(Request $request)
    {
        $data = $request->validate(['class_id' => ['required', 'uuid', 'exists:classes,id'], 'attendance_date' => ['required', 'date'], 'status' => ['required', 'array', 'min:1'], 'status.*' => ['required', 'in:HADIR,TIDAK_HADIR,LEWAT,BERCUTI'], 'catatan' => ['nullable', 'array'], 'catatan.*' => ['nullable', 'string', 'max:255']]);
        $class = SchoolClass::query()->findOrFail($data['class_id']);
        abort_unless($request->user()->canAccessSchool($class->kod_sekolah), 403);
        if ($request->user()->role === \App\Models\User::CLASS_TEACHER) {
            abort_unless(DB::table('teacher_class_assignments')->where(['user_id' => $request->user()->id, 'class_id' => $class->id])->exists(), 403, 'Guru kelas tidak ditugaskan kepada kelas ini.');
        }
        $studentIds = $class->students()->whereIn('id', array_keys($data['status']))->where('status', 'AKTIF')->pluck('id');
        abort_unless($studentIds->count() === count($data['status']), 422, 'Senarai murid tidak sepadan dengan kelas.');
        $rows = collect($data['status'])->map(fn (string $status, string $studentId) => ['id' => (string) \Illuminate\Support\Str::uuid(), 'student_id' => $studentId, 'class_id' => $class->id, 'kod_sekolah' => $class->kod_sekolah, 'attendance_date' => $data['attendance_date'], 'status' => $status, 'catatan' => $data['catatan'][$studentId] ?? null, 'recorded_by' => $request->user()->id, 'created_at' => now(), 'updated_at' => now()])->all();
        DB::table('daily_attendance')->upsert($rows, ['student_id', 'attendance_date'], ['class_id', 'kod_sekolah', 'status', 'catatan', 'recorded_by', 'updated_at']);
        return redirect()->route('admin.attendance', ['class_id' => $class->id, 'attendance_date' => $data['attendance_date']])->with('status', 'Kehadiran berjaya disimpan.');
    }
}
