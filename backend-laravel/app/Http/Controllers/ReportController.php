<?php

namespace App\Http\Controllers;

use App\Models\Mark;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function schoolSummaries(Request $request): JsonResponse
    {
        $user = $request->user();
        $schools = DB::table('schools')->where('status', 'AKTIF')->get()->filter(fn ($school) => $user->canAccessSchool($school->kod_sekolah));
        $schoolCodes = $schools->pluck('kod_sekolah');
        $exams = DB::table('exams')->where('status', '!=', 'DIBATALKAN')->get()->keyBy('id');
        $marks = Mark::query()->whereIn('kod_sekolah', $schoolCodes)->get()->filter(fn ($mark) => $exams->has($mark->exam_id));
        $rows = $marks->groupBy(fn ($mark) => $mark->kod_sekolah.'|'.$mark->exam_id)->map(function ($items) use ($exams): array {
            $first = $items->first(); $exam = $exams->get($first->exam_id); $values = $items->pluck('markah')->filter(fn ($value) => $value !== null)->map(fn ($value) => (float) $value);
            return ['tahun_akademik' => (int) $exam->tahun_akademik, 'kod_peperiksaan' => $exam->kod_peperiksaan, 'kod_sekolah' => $first->kod_sekolah, 'jumlah_murid' => $items->pluck('student_id')->unique()->count(), 'purata_sekolah' => $values->isEmpty() ? null : round($values->average(), 2), 'bil_mumtaz' => 0, 'bil_lulus' => 0, 'peratus_mumtaz' => null, 'peratus_lulus' => null];
        })->values();
        return response()->json(['data' => $rows]);
    }

    public function subjectSummaries(Request $request): JsonResponse
    {
        $user = $request->user();
        $schools = DB::table('schools')->where('status', 'AKTIF')->get()->filter(fn ($school) => $user->canAccessSchool($school->kod_sekolah));
        $codes = $schools->pluck('kod_sekolah');
        $exams = DB::table('exams')->where('status', '!=', 'DIBATALKAN')->get()->keyBy('id');
        $subjects = DB::table('subjects')->get()->keyBy('kod_subjek');
        $marks = Mark::query()->whereIn('kod_sekolah', $codes)->get()->filter(fn ($mark) => $exams->has($mark->exam_id));
        $rows = $marks->groupBy(fn ($mark) => implode('|', [$mark->exam_id, $mark->kod_sekolah, $mark->class_id, $mark->kod_subjek]))->map(function ($items) use ($exams, $subjects): array {
            $first = $items->first(); $exam = $exams->get($first->exam_id); $subject = $subjects->get($first->kod_subjek); $values = $items->pluck('markah')->filter(fn ($value) => $value !== null)->map(fn ($value) => (float) $value);
            return ['tahun_akademik' => (int) $exam->tahun_akademik, 'kod_peperiksaan' => $exam->kod_peperiksaan, 'kod_sekolah' => $first->kod_sekolah, 'class_id' => $first->class_id, 'kod_subjek' => $first->kod_subjek, 'nama_subjek' => $subject?->nama_subjek ?? $first->kod_subjek, 'bil_markah' => $values->count(), 'purata_subjek' => $values->isEmpty() ? null : round($values->average(), 2), 'bil_lulus' => 0, 'bil_gagal' => 0];
        })->values();
        return response()->json(['data' => $rows]);
    }

    public function individual(Request $request): JsonResponse
    {
        $user = $request->user();
        $schools = DB::table('schools')->where('status', 'AKTIF')->orderBy('kod_sekolah')->get();
        $schools = $schools->filter(fn (object $school): bool => $user->canAccessSchool($school->kod_sekolah))->values();
        $schoolCodes = $schools->pluck('kod_sekolah');

        $classes = DB::table('classes')->whereIn('kod_sekolah', $schoolCodes)->where('status', 'AKTIF')->orderBy('nama_kelas')->get();
        $students = Student::query()->whereIn('kod_sekolah', $schoolCodes)->where('status', 'AKTIF')->get();
        $exams = DB::table('exams')->where('status', '!=', 'DIBATALKAN')->orderByDesc('tahun_akademik')->get();
        $subjects = DB::table('subjects')->where('status', 'AKTIF')->get()->keyBy('kod_subjek');

        $marks = Mark::query()->whereIn('kod_sekolah', $schoolCodes)->get();
        $examById = $exams->keyBy('id');
        $studentById = $students->keyBy('id');
        $classById = $classes->keyBy('id');

        $validMarks = $marks->filter(fn (Mark $mark): bool => $examById->has($mark->exam_id) && $studentById->has($mark->student_id));
        $summaryGroups = $validMarks->groupBy(fn (Mark $mark): string => implode('|', [$mark->exam_id, $mark->student_id, $mark->class_id]));
        $summaries = $summaryGroups->map(function ($rows) use ($examById, $studentById): array {
            $first = $rows->first();
            $exam = $examById->get($first->exam_id);
            $student = $studentById->get($first->student_id);
            $numeric = $rows->pluck('markah')->filter(fn ($value): bool => $value !== null)->map(fn ($value): float => (float) $value);
            return [
                'tahun_akademik' => (int) $exam->tahun_akademik,
                'kod_peperiksaan' => $exam->kod_peperiksaan,
                'kod_sekolah' => $first->kod_sekolah,
                'class_id' => $first->class_id,
                'student_id' => $first->student_id,
                'mykid' => $student->mykid,
                'nama_murid' => $student->nama,
                'bil_subjek_dikira' => $numeric->count(),
                'purata' => $numeric->isEmpty() ? null : round($numeric->average(), 2),
                'jumlah_markah' => $numeric->isEmpty() ? null : round($numeric->sum(), 2),
            ];
        })->values();

        $markRows = $validMarks->map(function (Mark $mark) use ($examById, $studentById, $classById, $subjects): array {
            $exam = $examById->get($mark->exam_id);
            $student = $studentById->get($mark->student_id);
            $class = $classById->get($mark->class_id);
            $subject = $subjects->get($mark->kod_subjek);
            return [
                'id' => $mark->id,
                'markah' => $mark->markah === null ? null : (float) $mark->markah,
                'kod_subjek' => $mark->kod_subjek,
                'kod_sekolah' => $mark->kod_sekolah,
                'exam_id' => $mark->exam_id,
                'student_id' => $mark->student_id,
                'class_id' => $mark->class_id,
                'students' => $student ? ['id' => $student->id, 'mykid' => $student->mykid, 'nama_murid' => $student->nama, 'jantina' => $student->jantina, 'kod_sekolah' => $student->kod_sekolah, 'class_id' => $student->class_id, 'status' => $student->status] : null,
                'subjects' => $subject ? ['kod_subjek' => $subject->kod_subjek, 'nama_subjek' => $subject->nama_subjek, 'markah_penuh' => (float) $subject->markah_penuh, 'dikira_purata' => (bool) $subject->dikira_purata, 'susunan' => $subject->susunan, 'status' => $subject->status] : null,
                'exams' => ['id' => $exam->id, 'kod_peperiksaan' => $exam->kod_peperiksaan, 'nama_peperiksaan' => $exam->nama_peperiksaan, 'tahun_akademik' => (int) $exam->tahun_akademik, 'status' => $exam->status],
                'classes' => $class ? ['id' => $class->id, 'kod_sekolah' => $class->kod_sekolah, 'tahun_akademik' => (int) $class->tahun_akademik, 'tahun' => (int) $class->tahun, 'nama_kelas' => $class->nama_kelas, 'status' => $class->status] : null,
            ];
        })->values();

        return response()->json(['data' => ['schools' => $schools, 'classes' => $classes, 'summaries' => $summaries, 'marks' => $markRows, 'teacherClassAssignments' => []]]);
    }

    public function student(Request $request, string $studentId): JsonResponse
    {
        $student = Student::query()->whereKey($studentId)->firstOrFail();
        abort_unless($request->user()->canAccessSchool($student->kod_sekolah), 403);

        return response()->json(['data' => [
            'student' => $student,
            'marks' => Mark::query()->where('student_id', $student->id)->orderByDesc('created_at')->get(),
        ]]);
    }

    public function classReport(Request $request, string $classId): JsonResponse
    {
        $class = \App\Models\SchoolClass::query()->findOrFail($classId);
        abort_unless($request->user()->canAccessSchool($class->kod_sekolah), 403);
        $students = Student::query()->where('class_id', $class->id)->where('status', 'AKTIF')->orderBy('nama')->get();
        $marks = Mark::query()->where('class_id', $class->id)->get(['student_id', 'exam_id', 'kod_subjek', 'markah']);
        $byStudent = $marks->groupBy('student_id');
        $rows = $students->map(function (Student $student) use ($byStudent): array {
            $studentMarks = $byStudent->get($student->id, collect())->pluck('markah')->filter(fn ($mark) => $mark !== null)->map(fn ($mark) => (float) $mark);
            return [
                'student' => $student,
                'mark_count' => $studentMarks->count(),
                'average' => $studentMarks->isEmpty() ? null : round($studentMarks->average(), 2),
            ];
        });

        return response()->json(['data' => ['class' => $class, 'students' => $rows]]);
    }
}
