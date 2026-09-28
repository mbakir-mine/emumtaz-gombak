<?php

namespace App\Http\Controllers;

use App\Models\Mark;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MarkController extends Controller
{
    public function components(Request $request): JsonResponse
    {
        $data = $request->validate(['exam_id' => ['required', 'uuid'], 'class_id' => ['required', 'uuid'], 'kod_subjek' => ['required', 'string']]);
        $class = \App\Models\SchoolClass::query()->findOrFail($data['class_id']);
        abort_unless($request->user()->canAccessSchool($class->kod_sekolah), 403);
        return response()->json(['data' => DB::table('mark_components')->where($data)->get()]);
    }

    public function componentDefinitions(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_subjek' => ['nullable', 'string']]);
        $query = DB::table('subject_components')->where('status', 'AKTIF')->orderBy('kod_subjek')->orderBy('susunan');
        if (! empty($data['kod_subjek'])) {
            $query->where('kod_subjek', $data['kod_subjek']);
        }
        return response()->json(['data' => $query->get()]);
    }

    public function storeComponents(Request $request): JsonResponse
    {
        $data = $request->validate([
            'exam_id' => ['required', 'uuid', 'exists:exams,id'], 'class_id' => ['required', 'uuid', 'exists:classes,id'],
            'kod_sekolah' => ['required', 'string', 'max:32'], 'kod_subjek' => ['required', 'string'],
            'definitions' => ['array'], 'definitions.*.kod_komponen' => ['required', 'string'], 'definitions.*.nama_komponen' => ['required', 'string'], 'definitions.*.markah_penuh' => ['required', 'numeric', 'gt:0'], 'definitions.*.susunan' => ['required', 'integer'],
            'rows' => ['array'], 'rows.*.student_id' => ['required', 'uuid'], 'rows.*.kod_komponen' => ['required', 'string'], 'rows.*.markah' => ['nullable', 'numeric', 'min:0'],
        ]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        foreach ($data['definitions'] ?? [] as $definition) {
            DB::table('subject_components')->updateOrInsert(['kod_subjek' => $data['kod_subjek'], 'kod_komponen' => $definition['kod_komponen']], array_merge($definition, ['kod_subjek' => $data['kod_subjek'], 'updated_at' => now(), 'created_at' => now(), 'id' => (string) Str::uuid(), 'status' => 'AKTIF']));
        }
        foreach ($data['rows'] ?? [] as $row) {
            DB::table('mark_components')->updateOrInsert(['exam_id' => $data['exam_id'], 'student_id' => $row['student_id'], 'kod_subjek' => $data['kod_subjek'], 'kod_komponen' => $row['kod_komponen']], ['id' => (string) Str::uuid(), 'kod_sekolah' => $data['kod_sekolah'], 'class_id' => $data['class_id'], 'markah' => $row['markah'], 'updated_at' => now(), 'created_at' => now()]);
        }
        foreach (collect($data['rows'] ?? [])->groupBy('student_id') as $studentId => $studentRows) {
            $values = collect($studentRows)->pluck('markah')->filter(fn ($value): bool => $value !== null)->map(fn ($value): float => (float) $value);
            DB::table('marks')->updateOrInsert(['exam_id' => $data['exam_id'], 'student_id' => $studentId, 'kod_subjek' => $data['kod_subjek']], ['id' => (string) Str::uuid(), 'kod_sekolah' => $data['kod_sekolah'], 'class_id' => $data['class_id'], 'markah' => $values->count() === count($studentRows) ? $values->sum() : null, 'updated_at' => now(), 'created_at' => now()]);
        }
        return response()->json(['ok' => true]);
    }

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'exam_id' => ['required', 'uuid', 'exists:exams,id'],
            'class_id' => ['required', 'uuid', 'exists:classes,id'],
            'kod_subjek' => ['required', 'string', 'max:64'],
        ]);
        $class = \App\Models\SchoolClass::query()->findOrFail($data['class_id']);
        abort_unless($request->user()->canAccessSchool($class->kod_sekolah), 403);
        return response()->json(['data' => Mark::query()
            ->where($data)
            ->get(['id', 'exam_id', 'student_id', 'kod_sekolah', 'class_id', 'kod_subjek', 'markah'])]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'exam_id' => ['required', 'uuid', 'exists:exams,id'],
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'kod_sekolah' => ['required', 'string', 'max:32'],
            'class_id' => ['required', 'uuid', 'exists:classes,id'],
            'kod_subjek' => ['required', 'string', 'max:64', 'exists:subjects,kod_subjek'],
            'markah' => ['nullable', 'numeric', 'between:0,10000'],
        ]);

        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        $student = \App\Models\Student::query()->whereKey($data['student_id'])->firstOrFail();
        $class = \App\Models\SchoolClass::query()->whereKey($data['class_id'])->firstOrFail();
        if ($student->kod_sekolah !== $data['kod_sekolah'] || $class->kod_sekolah !== $data['kod_sekolah'] || ($student->class_id && $student->class_id !== $class->id)) {
            throw ValidationException::withMessages(['kod_sekolah' => 'Murid, kelas dan sekolah tidak sepadan.']);
        }
        $role = $request->user()->role;
        if ($role === \App\Models\User::SUBJECT_TEACHER && ! \Illuminate\Support\Facades\DB::table('teacher_subject_assignments')
            ->where('user_id', $request->user()->id)->where('class_id', $class->id)->where('kod_subjek', $data['kod_subjek'])->exists()) {
            abort(403, 'Guru subjek tidak ditugaskan kepada kelas dan subjek ini.');
        }
        if ($role === \App\Models\User::CLASS_TEACHER && ! \Illuminate\Support\Facades\DB::table('teacher_class_assignments')
            ->where('user_id', $request->user()->id)->where('class_id', $class->id)->exists()) {
            abort(403, 'Guru kelas tidak ditugaskan kepada kelas ini.');
        }
        $data['entered_by'] = $request->user()->id;
        $data['id'] = (string) Str::uuid();
        $mark = Mark::query()->updateOrCreate(
            ['exam_id' => $data['exam_id'], 'student_id' => $data['student_id'], 'kod_subjek' => $data['kod_subjek']],
            $data,
        );

        return response()->json(['data' => $mark], $mark->wasRecentlyCreated ? 201 : 200);
    }
}
