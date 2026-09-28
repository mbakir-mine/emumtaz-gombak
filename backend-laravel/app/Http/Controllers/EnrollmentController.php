<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EnrollmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = DB::table('student_enrollments as e')->join('students as s', 's.id', '=', 'e.student_id')->leftJoin('classes as c', 'c.id', '=', 'e.class_id')->leftJoin('schools as sc', 'sc.kod_sekolah', '=', 'e.kod_sekolah')->select('e.*', 's.mykid', 's.nama as nama_murid', 's.jantina', 'c.tahun', 'c.nama_kelas', 'sc.nama_sekolah', 'sc.kategori', 'sc.zon')->orderByDesc('e.tahun_akademik')->orderBy('e.kod_sekolah');
        if (! in_array($user->role, ['OWNER', 'ADMIN_DAERAH'], true)) $query->where('e.kod_sekolah', $user->kod_sekolah);
        return response()->json(['data' => $query->limit(10000)->get()]);
    }

    public function promote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'source_year' => ['required', 'integer', 'between:2000,2100'],
            'target_year' => ['required', 'integer', 'between:2000,2100', 'gt:source_year'],
            'student_ids' => ['required', 'array', 'min:1'],
            'student_ids.*' => ['uuid', 'exists:students,id'],
            'target_class_ids' => ['nullable', 'array'],
            'target_class_ids.*' => ['nullable', 'uuid', 'exists:classes,id'],
        ]);

        $selectedIds = array_values(array_unique($data['student_ids']));
        $targetIds = $data['target_class_ids'] ?? [];

        $sources = DB::table('student_enrollments as e')
            ->join('students as s', 's.id', '=', 'e.student_id')
            ->leftJoin('classes as c', 'c.id', '=', 'e.class_id')
            ->where('e.tahun_akademik', $data['source_year'])
            ->where('e.status', 'AKTIF')
            ->whereIn('e.student_id', $selectedIds)
            ->select('e.student_id', 'e.kod_sekolah', 'e.class_id', 'c.tahun', 'c.nama_kelas')
            ->get();

        abort_unless($sources->count() === count($selectedIds), 422, 'Sebahagian murid tiada rekod aktif tahun asal.');

        $targetClasses = DB::table('classes')
            ->where('tahun_akademik', $data['target_year'])
            ->where('status', 'AKTIF')
            ->get(['id', 'kod_sekolah', 'tahun', 'nama_kelas']);

        $classById = $targetClasses->keyBy('id');
        $normalise = static fn (string $name): string => strtoupper(trim((string) preg_replace('/^\s*\d+\s*/', '', preg_replace('/\s+/', ' ', $name))));
        $planned = [];
        $graduates = [];
        $needsReview = 0;

        foreach ($sources as $index => $source) {
            abort_unless($request->user()->canAccessSchool($source->kod_sekolah), 403);
            if ((int) $source->tahun >= 6) {
                $graduates[] = $source;
                continue;
            }

            $chosen = $classById->get($targetIds[$index] ?? null);
            if (!$chosen || $chosen->kod_sekolah !== $source->kod_sekolah || (int) $chosen->tahun !== ((int) $source->tahun + 1)) {
                $targetYearLevel = (int) $source->tahun + 1;
                $sameSchool = $targetClasses->filter(fn ($class) => $class->kod_sekolah === $source->kod_sekolah && (int) $class->tahun === $targetYearLevel);
                $sourceStem = $source->nama_kelas ? $normalise($source->nama_kelas) : '';
                $chosen = $sameSchool->first(fn ($class) => $normalise($class->nama_kelas) === $sourceStem) ?: $sameSchool->first();
            }
            if ($chosen) {
                $planned[] = [$source, $chosen];
            } else {
                $needsReview++;
            }
        }

        abort_unless(count($planned) + count($graduates) > 0, 422, 'Tiada murid boleh diproses. Semak kelas tahun baharu.');

        DB::transaction(function () use ($data, $planned, $graduates): void {
            foreach ($planned as [$source, $target]) {
                $this->upsertEnrollment($source->student_id, $data['target_year'], $target->kod_sekolah, $target->id, 'AKTIF', "Naik tahun daripada {$data['source_year']} ke {$data['target_year']}");
                DB::table('students')->where('id', $source->student_id)->update(['kod_sekolah' => $target->kod_sekolah, 'class_id' => $target->id, 'status' => 'AKTIF', 'tahun_akademik' => $data['target_year'], 'updated_at' => now()]);
            }
            foreach ($graduates as $source) {
                $this->upsertEnrollment($source->student_id, $data['target_year'], $source->kod_sekolah, null, 'TAMAT', "Tamat Tahun 6 selepas {$data['source_year']}");
                DB::table('students')->where('id', $source->student_id)->update(['class_id' => null, 'status' => 'TAMAT', 'tahun_akademik' => $data['target_year'], 'updated_at' => now()]);
            }
        });

        return response()->json(['ok' => true, 'promoted' => count($planned), 'graduates' => count($graduates), 'needs_review' => $needsReview]);
    }

    public function enroll(Request $request): JsonResponse
    {
        $data = $request->validate(['student_id' => ['required', 'uuid', 'exists:students,id'], 'tahun_akademik' => ['required', 'integer', 'between:2000,2100'], 'kod_sekolah' => ['required', 'max:40'], 'class_id' => ['nullable', 'uuid', 'exists:classes,id'], 'catatan' => ['nullable', 'string']]);
        $this->assertAccess($request, $data['kod_sekolah'], $data['class_id']);
        DB::table('student_enrollments')->updateOrInsert(['student_id' => $data['student_id'], 'tahun_akademik' => $data['tahun_akademik']], [...$data, 'id' => DB::table('student_enrollments')->where(['student_id' => $data['student_id'], 'tahun_akademik' => $data['tahun_akademik']])->value('id') ?? (string) Str::uuid(), 'status' => 'AKTIF', 'updated_at' => now(), 'created_at' => now()]);
        return response()->json(['ok' => true], 201);
    }

    public function transfer(Request $request): JsonResponse
    {
        $data = $request->validate(['student_id' => ['required', 'uuid', 'exists:students,id'], 'to_kod_sekolah' => ['required', 'max:40', 'exists:schools,kod_sekolah'], 'to_class_id' => ['required', 'uuid', 'exists:classes,id'], 'transfer_type' => ['sometimes', 'string', 'max:40']]);
        $student = DB::table('students')->where('id', $data['student_id'])->first();
        abort_unless($student && $request->user()->canAccessSchool($student->kod_sekolah), 403);
        abort_unless($request->user()->canAccessSchool($data['to_kod_sekolah']), 403);
        abort_unless(DB::table('classes')->where(['id' => $data['to_class_id'], 'kod_sekolah' => $data['to_kod_sekolah']])->exists(), 422, 'Kelas destinasi tidak sepadan.');
        DB::transaction(function () use ($data, $student, $request): void {
            DB::table('student_transfer_logs')->insert(['id' => (string) Str::uuid(), 'student_id' => $student->id, 'mykid' => $student->mykid, 'nama_murid' => $student->nama, 'from_kod_sekolah' => $student->kod_sekolah, 'to_kod_sekolah' => $data['to_kod_sekolah'], 'from_class_id' => $student->class_id, 'to_class_id' => $data['to_class_id'], 'transfer_type' => $data['transfer_type'] ?? 'DALAM_DAERAH', 'confirmed_by' => $request->user()->id, 'confirmed_at' => now()]);
            DB::table('students')->where('id', $student->id)->update(['kod_sekolah' => $data['to_kod_sekolah'], 'class_id' => $data['to_class_id'], 'updated_at' => now()]);
        });
        return response()->json(['ok' => true, 'student_id' => $student->id]);
    }

    private function assertAccess(Request $request, string $school, ?string $class): void
    {
        abort_unless($request->user()->canAccessSchool($school), 403);
        if ($class) abort_unless(DB::table('classes')->where(['id' => $class, 'kod_sekolah' => $school])->exists(), 422, 'Kelas tidak sepadan dengan sekolah.');
    }

    private function upsertEnrollment(string $studentId, int $year, string $school, ?string $classId, string $status, string $note): void
    {
        $existingId = DB::table('student_enrollments')->where(['student_id' => $studentId, 'tahun_akademik' => $year])->value('id');
        DB::table('student_enrollments')->updateOrInsert(
            ['student_id' => $studentId, 'tahun_akademik' => $year],
            ['id' => $existingId ?: (string) Str::uuid(), 'kod_sekolah' => $school, 'class_id' => $classId, 'status' => $status, 'catatan' => $note, 'updated_at' => now(), 'created_at' => now()],
        );
    }
}
