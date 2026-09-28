<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AssignmentController extends Controller
{
    public function bulk(Request $request): JsonResponse
    {
        $data = $request->validate([
            'class_id' => ['required', 'uuid', 'exists:classes,id'],
            'teacher_class' => ['nullable', 'array'],
            'teacher_class.*.user_id' => ['nullable', 'uuid', 'exists:users,id'],
            'subjects' => ['nullable', 'array'],
            'subjects.*.user_id' => ['nullable', 'uuid', 'exists:users,id'],
            'subjects.*.kod_subjek' => ['required', 'string', 'max:64'],
            'subjects.*.assignment_label' => ['nullable', 'string', 'max:120'],
            'components' => ['nullable', 'array'],
            'components.*.user_id' => ['nullable', 'uuid', 'exists:users,id'],
            'components.*.kod_subjek' => ['required', 'string', 'max:64'],
            'components.*.kod_komponen' => ['required', 'string', 'max:64'],
            'requirements' => ['nullable', 'array'],
            'requirements.*.kod_subjek' => ['required', 'string', 'max:64'],
            'requirements.*.teacher_id' => ['nullable', 'uuid', 'exists:users,id'],
            'requirements.*.bil_slot_seminggu' => ['integer', 'between:0,40'],
        ]);
        $class = \App\Models\SchoolClass::query()->findOrFail($data['class_id']);
        $this->authorizeSchoolAdmin($request, $class->kod_sekolah);

        DB::transaction(function () use ($data, $class): void {
            DB::table('teacher_class_assignments')->where('class_id', $class->id)->delete();
            foreach ($data['teacher_class'] ?? [] as $row) {
                if (!empty($row['user_id'])) DB::table('teacher_class_assignments')->insert(['id' => (string) Str::uuid(), 'class_id' => $class->id, 'user_id' => $row['user_id'], 'created_at' => now(), 'updated_at' => now()]);
            }
            DB::table('teacher_subject_assignments')->where('class_id', $class->id)->delete();
            foreach ($data['subjects'] ?? [] as $row) {
                if (!empty($row['user_id'])) DB::table('teacher_subject_assignments')->insert(['id' => (string) Str::uuid(), 'class_id' => $class->id, 'user_id' => $row['user_id'], 'kod_subjek' => $row['kod_subjek'], 'assignment_label' => $row['assignment_label'] ?? null, 'created_at' => now(), 'updated_at' => now()]);
            }
            DB::table('teacher_subject_component_assignments')->where('class_id', $class->id)->delete();
            foreach ($data['components'] ?? [] as $row) {
                if (!empty($row['user_id'])) DB::table('teacher_subject_component_assignments')->insert(['id' => (string) Str::uuid(), 'class_id' => $class->id, 'user_id' => $row['user_id'], 'kod_subjek' => $row['kod_subjek'], 'kod_komponen' => $row['kod_komponen'], 'created_at' => now()]);
            }
            DB::table('timetable_requirements')->where('class_id', $class->id)->delete();
            foreach ($data['requirements'] ?? [] as $row) {
                if (!empty($row['teacher_id']) && (int) ($row['bil_slot_seminggu'] ?? 0) > 0) DB::table('timetable_requirements')->insert(['id' => (string) Str::uuid(), 'kod_sekolah' => $class->kod_sekolah, 'class_id' => $class->id, 'kod_subjek' => $row['kod_subjek'], 'kod_komponen' => $row['kod_komponen'] ?? null, 'assignment_label' => $row['assignment_label'] ?? null, 'nama_paparan' => $row['nama_paparan'] ?? null, 'teacher_id' => $row['teacher_id'], 'bil_slot_seminggu' => $row['bil_slot_seminggu'], 'boleh_gabung' => (bool) ($row['boleh_gabung'] ?? false), 'status' => 'AKTIF', 'created_at' => now(), 'updated_at' => now()]);
            }
        });
        return response()->json(['ok' => true]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $classQuery = DB::table('teacher_class_assignments as a')->join('classes as c', 'c.id', '=', 'a.class_id')->select('a.*');
        $subjectQuery = DB::table('teacher_subject_assignments as a')->join('classes as c', 'c.id', '=', 'a.class_id')->select('a.*');
        if (! in_array($user->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN], true)) {
            $schoolCodes = \App\Models\School::query()->where('status', 'AKTIF')->get()->filter(fn ($school) => $user->canAccessSchool($school->kod_sekolah))->pluck('kod_sekolah');
            $classQuery->whereIn('c.kod_sekolah', $schoolCodes);
            $subjectQuery->whereIn('c.kod_sekolah', $schoolCodes);
        }
        $componentQuery = DB::table('teacher_subject_component_assignments as a')->join('classes as c', 'c.id', '=', 'a.class_id')->select('a.*');
        if (! in_array($user->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN], true)) $componentQuery->whereIn('c.kod_sekolah', $schoolCodes ?? collect([$user->kod_sekolah]));
        return response()->json(['data' => ['class' => $classQuery->get(), 'subject' => $subjectQuery->get(), 'component' => $componentQuery->get()]]);
    }

    public function classTeacher(Request $request): JsonResponse
    {
        $data = $request->validate(['user_id' => ['required', 'uuid', 'exists:users,id'], 'class_id' => ['required', 'uuid', 'exists:classes,id']]);
        $class = \App\Models\SchoolClass::query()->findOrFail($data['class_id']);
        $this->authorizeSchoolAdmin($request, $class->kod_sekolah);
        $id = DB::table('teacher_class_assignments')->where($data)->value('id') ?: (string) Str::uuid();
        DB::table('teacher_class_assignments')->updateOrInsert(['user_id' => $data['user_id'], 'class_id' => $data['class_id']], ['id' => $id, 'updated_at' => now(), 'created_at' => now()]);
        return response()->json(['ok' => true, 'id' => $id], 201);
    }

    public function subjectTeacher(Request $request): JsonResponse
    {
        $data = $request->validate(['user_id' => ['required', 'uuid', 'exists:users,id'], 'class_id' => ['required', 'uuid', 'exists:classes,id'], 'kod_subjek' => ['required', 'string', 'exists:subjects,kod_subjek'], 'assignment_label' => ['nullable', 'string', 'max:120']]);
        $class = \App\Models\SchoolClass::query()->findOrFail($data['class_id']);
        $this->authorizeSchoolAdmin($request, $class->kod_sekolah);
        $id = DB::table('teacher_subject_assignments')->where(['user_id' => $data['user_id'], 'class_id' => $data['class_id'], 'kod_subjek' => $data['kod_subjek']])->value('id') ?: (string) Str::uuid();
        DB::table('teacher_subject_assignments')->updateOrInsert(
            ['user_id' => $data['user_id'], 'class_id' => $data['class_id'], 'kod_subjek' => $data['kod_subjek']],
            ['id' => $id, 'assignment_label' => $data['assignment_label'] ?? null, 'updated_at' => now(), 'created_at' => now()],
        );
        return response()->json(['ok' => true, 'id' => $id], 201);
    }

    private function authorizeSchoolAdmin(Request $request, string $schoolCode): void
    {
        abort_unless(in_array($request->user()->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN, \App\Models\User::ZONE_ADMIN, \App\Models\User::SCHOOL_ADMIN], true), 403);
        abort_unless($request->user()->canAccessSchool($schoolCode), 403);
    }
}
