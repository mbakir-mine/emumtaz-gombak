<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StudentAndMarkApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_school_user_cannot_create_student_in_another_school(): void
    {
        $user = User::query()->create([
            'id' => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'name' => 'Admin', 'email' => 'admin@example.test',
            'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001',
        ]);

        $this->actingAs($user)->postJson('/api/students', [
            'mykid' => '260101010001', 'nama' => 'Murid', 'kod_sekolah' => 'SRA002',
        ])->assertForbidden();
    }

    public function test_owner_can_create_student_in_a_school(): void
    {
        $user = User::query()->create([
            'id' => 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'name' => 'Owner', 'email' => 'owner@example.test',
            'password' => Hash::make('Password!123'), 'role' => User::OWNER, 'status' => 'AKTIF',
        ]);

        $this->actingAs($user)->postJson('/api/students', [
            'mykid' => '260101010002', 'nama' => 'Murid Owner', 'kod_sekolah' => 'SRA001',
        ])->assertCreated()->assertJsonPath('data.nama', 'Murid Owner');
    }

    public function test_school_user_cannot_view_student_report_from_another_school(): void
    {
        $user = User::query()->create([
            'id' => 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'name' => 'Admin', 'email' => 'report@example.test',
            'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001',
        ]);
        $student = \App\Models\Student::query()->create([
            'id' => 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'mykid' => '260101010003', 'nama' => 'Murid Lain',
            'kod_sekolah' => 'SRA002', 'status' => 'AKTIF',
        ]);

        $this->actingAs($user)->getJson('/api/reports/students/'.$student->id)->assertForbidden();
    }

    public function test_student_cannot_be_assigned_to_a_class_from_another_school(): void
    {
        $user = User::query()->create([
            'id' => '12121212-1212-1212-1212-121212121212', 'name' => 'Owner', 'email' => 'class-check@example.test',
            'password' => Hash::make('Password!123'), 'role' => User::OWNER, 'status' => 'AKTIF',
        ]);
        \App\Models\SchoolClass::query()->create([
            'id' => '13131313-1313-1313-1313-131313131313', 'kod_sekolah' => 'SRA002', 'tahun_akademik' => 2026,
            'tahun' => 1, 'nama_kelas' => '1 Amanah', 'status' => 'AKTIF',
        ]);

        $this->actingAs($user)->postJson('/api/students', [
            'mykid' => '260101010004', 'nama' => 'Murid Salah Kelas', 'kod_sekolah' => 'SRA001',
            'class_id' => '13131313-1313-1313-1313-131313131313',
        ])->assertUnprocessable()->assertJsonValidationErrors('class_id');
    }

    public function test_subject_teacher_cannot_enter_mark_without_assignment(): void
    {
        $user = User::query()->create([
            'id' => '14141414-1414-1414-1414-141414141414', 'name' => 'Guru', 'email' => 'mark-access@example.test',
            'password' => Hash::make('Password!123'), 'role' => User::SUBJECT_TEACHER, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001',
        ]);
        \App\Models\School::query()->create(['id' => '15151515-1515-1515-1515-151515151515', 'kod_sekolah' => 'SRA001', 'nama_sekolah' => 'Sekolah', 'status' => 'AKTIF']);
        \App\Models\SchoolClass::query()->create(['id' => '16161616-1616-1616-1616-161616161616', 'kod_sekolah' => 'SRA001', 'tahun_akademik' => 2026, 'tahun' => 1, 'nama_kelas' => '1 Amanah', 'status' => 'AKTIF']);
        \App\Models\Student::query()->create(['id' => '17171717-1717-1717-1717-171717171717', 'mykid' => '260101010005', 'nama' => 'Murid', 'kod_sekolah' => 'SRA001', 'class_id' => '16161616-1616-1616-1616-161616161616', 'status' => 'AKTIF']);
        \App\Models\Subject::query()->create(['id' => '18181818-1818-1818-1818-181818181818', 'kod_subjek' => 'TAUHID', 'nama_subjek' => 'Tauhid', 'markah_penuh' => 100, 'status' => 'AKTIF']);
        \App\Models\Exam::query()->create(['id' => '19191919-1919-1919-1919-191919191919', 'kod_peperiksaan' => 'UPSA', 'nama_peperiksaan' => 'Ujian', 'tahun_akademik' => 2026, 'status' => 'DIBUKA']);

        $this->actingAs($user)->postJson('/api/marks', [
            'exam_id' => '19191919-1919-1919-1919-191919191919', 'student_id' => '17171717-1717-1717-1717-171717171717',
            'kod_sekolah' => 'SRA001', 'class_id' => '16161616-1616-1616-1616-161616161616', 'kod_subjek' => 'TAUHID', 'markah' => 80,
        ])->assertForbidden();
    }
}
