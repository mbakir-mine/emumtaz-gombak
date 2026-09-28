<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AssignmentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_school_admin_can_assign_subject_teacher_in_own_school(): void
    {
        $admin = User::query()->create(['id' => '21212121-2121-2121-2121-212121212121', 'name' => 'Admin', 'email' => 'assign-admin@example.test', 'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001']);
        $teacher = User::query()->create(['id' => '23232323-2323-2323-2323-232323232323', 'name' => 'Guru', 'email' => 'assign-teacher@example.test', 'password' => Hash::make('Password!123'), 'role' => User::SUBJECT_TEACHER, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001']);
        \App\Models\School::query()->create(['id' => '24242424-2424-2424-2424-242424242424', 'kod_sekolah' => 'SRA001', 'nama_sekolah' => 'Sekolah', 'status' => 'AKTIF']);
        \App\Models\SchoolClass::query()->create(['id' => '25252525-2525-2525-2525-252525252525', 'kod_sekolah' => 'SRA001', 'tahun_akademik' => 2026, 'tahun' => 1, 'nama_kelas' => '1 Amanah', 'status' => 'AKTIF']);
        \App\Models\Subject::query()->create(['id' => '26262626-2626-2626-2626-262626262626', 'kod_subjek' => 'TAUHID', 'nama_subjek' => 'Tauhid', 'markah_penuh' => 100, 'status' => 'AKTIF']);

        $this->actingAs($admin)->postJson('/api/assignments/subject-teacher', ['user_id' => $teacher->id, 'class_id' => '25252525-2525-2525-2525-252525252525', 'kod_subjek' => 'TAUHID'])->assertCreated();
        $this->assertDatabaseHas('teacher_subject_assignments', ['user_id' => $teacher->id, 'kod_subjek' => 'TAUHID']);
    }
}
