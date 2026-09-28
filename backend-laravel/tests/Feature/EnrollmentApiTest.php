<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class EnrollmentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_promote_students_in_one_transaction(): void
    {
        $admin = User::query()->create(['id' => (string) Str::uuid(), 'name' => 'Owner', 'email' => 'promotion-owner@example.test', 'password' => 'hashed', 'role' => User::OWNER, 'status' => 'AKTIF']);
        School::query()->create(['id' => (string) Str::uuid(), 'kod_sekolah' => 'SRA001', 'nama_sekolah' => 'Sekolah', 'status' => 'AKTIF']);
        $source = SchoolClass::query()->create(['id' => (string) Str::uuid(), 'kod_sekolah' => 'SRA001', 'tahun_akademik' => 2026, 'tahun' => 1, 'nama_kelas' => '1 Amanah', 'status' => 'AKTIF']);
        $target = SchoolClass::query()->create(['id' => (string) Str::uuid(), 'kod_sekolah' => 'SRA001', 'tahun_akademik' => 2027, 'tahun' => 2, 'nama_kelas' => '2 Amanah', 'status' => 'AKTIF']);
        $studentId = (string) Str::uuid();
        DB::table('students')->insert(['id' => $studentId, 'kod_sekolah' => 'SRA001', 'class_id' => $source->id, 'mykid' => '900101-01-0001', 'nama' => 'Ali', 'status' => 'AKTIF', 'tahun_akademik' => 2026, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('student_enrollments')->insert(['id' => (string) Str::uuid(), 'student_id' => $studentId, 'tahun_akademik' => 2026, 'kod_sekolah' => 'SRA001', 'class_id' => $source->id, 'status' => 'AKTIF', 'created_at' => now(), 'updated_at' => now()]);

        $this->actingAs($admin)->postJson('/api/enrollments/promote', ['source_year' => 2026, 'target_year' => 2027, 'student_ids' => [$studentId], 'target_class_ids' => [$target->id]])->assertOk()->assertJsonPath('promoted', 1);
        $this->assertDatabaseHas('student_enrollments', ['student_id' => $studentId, 'tahun_akademik' => 2027, 'class_id' => $target->id, 'status' => 'AKTIF']);
        $this->assertDatabaseHas('students', ['id' => $studentId, 'class_id' => $target->id, 'tahun_akademik' => 2027]);
    }
}
