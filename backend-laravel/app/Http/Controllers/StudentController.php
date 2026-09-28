<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    public function schoolSummaries(Request $request): JsonResponse
    {
        $user = $request->user();
        $schools = DB::table('schools')->where('status', 'AKTIF')->get()->filter(fn ($school) => $user->canAccessSchool($school->kod_sekolah));
        $rows = $schools->map(function ($school): array {
            $students = DB::table('students')->where(['kod_sekolah' => $school->kod_sekolah, 'status' => 'AKTIF'])->get(['jantina']);
            return ['kod_sekolah' => $school->kod_sekolah, 'nama_sekolah' => $school->nama_sekolah, 'kategori' => $school->kategori, 'zon' => $school->zon, 'jumlah_murid' => $students->count(), 'murid_lelaki' => $students->where('jantina', 'L')->count(), 'murid_perempuan' => $students->where('jantina', 'P')->count()];
        })->values();
        return response()->json(['data' => $rows]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = \App\Models\Student::query()->where('status', 'AKTIF')->orderBy('nama');
        $user = $request->user();
        if (! in_array($user->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN], true)) {
            $query->where('kod_sekolah', $user->kod_sekolah);
        }
        if ($request->filled('kod_sekolah') && in_array($user->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN], true)) $query->where('kod_sekolah', $request->string('kod_sekolah'));
        if ($request->filled('class_id')) $query->where('class_id', $request->string('class_id'));

        $perPage = min(max((int) $request->integer('per_page', 50), 1), 1000);
        return response()->json(['data' => $query->paginate($perPage)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mykid' => ['required', 'string', 'max:32', 'unique:students,mykid'],
            'nama' => ['required', 'string', 'max:180'],
            'jantina' => ['nullable', 'string', 'max:20'],
            'kod_sekolah' => ['required', 'string', 'max:32'],
            'class_id' => ['nullable', 'uuid', 'exists:classes,id'],
            'tahun_akademik' => ['nullable', 'integer', 'between:2000,2100'],
        ]);

        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        if (! empty($data['class_id'])) {
            $class = \App\Models\SchoolClass::query()->whereKey($data['class_id'])->first();
            if (! $class || $class->kod_sekolah !== $data['kod_sekolah']) {
                throw ValidationException::withMessages(['class_id' => 'Kelas tidak sepadan dengan sekolah murid.']);
            }
        }
        $data['id'] = (string) Str::uuid();
        $data['status'] = 'AKTIF';
        $student = \App\Models\Student::query()->create($data);

        return response()->json(['data' => $student], 201);
    }

    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate(['mykid' => ['required', 'string', 'max:32'], 'nama' => ['required', 'string', 'max:180'], 'jantina' => ['nullable', 'string', 'max:20'], 'kod_sekolah' => ['required', 'string', 'max:32'], 'class_id' => ['required', 'uuid', 'exists:classes,id'], 'confirm_transfer' => ['boolean']]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        $class = \App\Models\SchoolClass::query()->findOrFail($data['class_id']);
        abort_unless($class->kod_sekolah === $data['kod_sekolah'], 422, 'Kelas tidak sepadan dengan sekolah murid.');
        $student = \App\Models\Student::query()->where('mykid', $data['mykid'])->first();
        if (! $student) { $data['id'] = (string) Str::uuid(); $data['status'] = 'AKTIF'; return response()->json(['data' => \App\Models\Student::query()->create($data)], 201); }
        $isTransfer = $student->kod_sekolah !== $data['kod_sekolah'] || $student->class_id !== $data['class_id'];
        abort_if($isTransfer && ! ($data['confirm_transfer'] ?? false), 409, 'Murid telah berada di sekolah atau kelas lain. Sahkan pindahan dahulu.');
        $old = $student->only(['kod_sekolah', 'class_id']);
        $student->update(['nama' => $data['nama'], 'jantina' => $data['jantina'] ?? null, 'kod_sekolah' => $data['kod_sekolah'], 'class_id' => $data['class_id'], 'status' => 'AKTIF']);
        if ($isTransfer) DB::table('student_transfer_logs')->insert(['id' => (string) Str::uuid(), 'student_id' => $student->id, 'mykid' => $data['mykid'], 'nama_murid' => $data['nama'], 'from_kod_sekolah' => $old['kod_sekolah'], 'to_kod_sekolah' => $data['kod_sekolah'], 'from_class_id' => $old['class_id'], 'to_class_id' => $data['class_id'], 'transfer_type' => 'DALAM_DAERAH', 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['data' => $student->fresh(), 'transferred' => $isTransfer]);
    }

    public function bulkStore(Request $request): JsonResponse
    {
        $data = $request->validate(['rows' => ['required', 'array', 'min:1', 'max:2000'], 'rows.*.mykid' => ['required', 'string', 'max:32'], 'rows.*.nama' => ['required', 'string', 'max:180'], 'rows.*.jantina' => ['nullable', 'string', 'max:20'], 'rows.*.kod_sekolah' => ['required', 'string', 'max:32'], 'rows.*.class_id' => ['nullable', 'uuid'], 'rows.*.tahun' => ['nullable', 'integer', 'between:1,6'], 'rows.*.tahun_akademik' => ['nullable', 'integer', 'between:2000,2100'], 'rows.*.nama_kelas' => ['nullable', 'string', 'max:120']]);
        $created = 0; $updated = 0; $classes = 0;
        DB::transaction(function () use ($request, $data, &$created, &$updated, &$classes): void {
            foreach ($data['rows'] as $row) {
                abort_unless($request->user()->canAccessSchool($row['kod_sekolah']), 403);
                $classId = $row['class_id'] ?? null;
                if (! $classId && ! empty($row['tahun']) && ! empty($row['tahun_akademik']) && ! empty($row['nama_kelas'])) {
                    $class = \App\Models\SchoolClass::query()->firstOrCreate(['kod_sekolah' => $row['kod_sekolah'], 'tahun_akademik' => $row['tahun_akademik'], 'tahun' => $row['tahun'], 'nama_kelas' => $row['nama_kelas']], ['id' => (string) Str::uuid(), 'status' => 'AKTIF']);
                    $classId = $class->id; if ($class->wasRecentlyCreated) $classes++;
                }
                $student = \App\Models\Student::query()->where('mykid', $row['mykid'])->first();
                $payload = ['nama' => $row['nama'], 'jantina' => $row['jantina'] ?? null, 'kod_sekolah' => $row['kod_sekolah'], 'class_id' => $classId, 'status' => 'AKTIF'];
                if ($student) { $student->update($payload); $updated++; } else { \App\Models\Student::query()->create(['id' => (string) Str::uuid(), 'mykid' => $row['mykid'], ...$payload]); $created++; }
            }
        });
        return response()->json(['created' => $created, 'updated' => $updated, 'classes' => $classes]);
    }
}
