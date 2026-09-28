<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AcademicSetupApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_school_admin_can_create_subject_and_exam(): void
    {
        $user = User::query()->create([
            'id' => 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'name' => 'Admin', 'email' => 'setup@example.test',
            'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001',
        ]);

        $this->actingAs($user)->postJson('/api/subjects', [
            'kod_subjek' => 'TAUHID', 'nama_subjek' => 'Tauhid', 'markah_penuh' => 100,
        ])->assertCreated();

        $this->actingAs($user)->postJson('/api/exams', [
            'kod_peperiksaan' => 'UPSA', 'nama_peperiksaan' => 'Ujian Pertengahan', 'tahun_akademik' => 2026,
        ])->assertCreated();
    }

    public function test_teacher_cannot_change_academic_setup(): void
    {
        $user = User::query()->create([
            'id' => 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'name' => 'Guru', 'email' => 'teacher@example.test',
            'password' => Hash::make('Password!123'), 'role' => User::GURU_SUBJEK, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001',
        ]);

        $this->actingAs($user)->postJson('/api/subjects', [
            'kod_subjek' => 'TAUHID', 'nama_subjek' => 'Tauhid', 'markah_penuh' => 100,
        ])->assertForbidden();
    }
}
