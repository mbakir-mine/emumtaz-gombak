<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AttendanceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_assigned_class_teacher_can_save_batch_attendance(): void
    {
        $user = User::query()->create(['id' => '31313131-3131-3131-3131-313131313131', 'name' => 'Guru', 'email' => 'attendance@example.test', 'password' => Hash::make('Password!123'), 'role' => User::CLASS_TEACHER, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001']);
        \App\Models\SchoolClass::query()->create(['id' => '32323232-3232-3232-3232-323232323232', 'kod_sekolah' => 'SRA001', 'tahun_akademik' => 2026, 'tahun' => 1, 'nama_kelas' => '1 Amanah', 'status' => 'AKTIF']);
        \App\Models\Student::query()->create(['id' => '33333333-3333-3333-3333-333333333333', 'mykid' => '260101010006', 'nama' => 'Murid', 'kod_sekolah' => 'SRA001', 'class_id' => '32323232-3232-3232-3232-323232323232', 'status' => 'AKTIF']);
        \Illuminate\Support\Facades\DB::table('teacher_class_assignments')->insert(['id' => '34343434-3434-3434-3434-343434343434', 'user_id' => $user->id, 'class_id' => '32323232-3232-3232-3232-323232323232', 'created_at' => now(), 'updated_at' => now()]);

        $this->actingAs($user)->postJson('/api/attendance', ['class_id' => '32323232-3232-3232-3232-323232323232', 'attendance_date' => '2026-09-28', 'records' => [['student_id' => '33333333-3333-3333-3333-333333333333', 'status' => 'HADIR']]])->assertOk()->assertJsonPath('count', 1);
        $this->assertDatabaseHas('daily_attendance', ['student_id' => '33333333-3333-3333-3333-333333333333', 'status' => 'HADIR']);
    }

    public function test_class_teacher_can_read_attendance_context_only_for_assigned_class(): void
    {
        $user = User::query()->create(['id' => '39393939-3939-3939-3939-393939393939', 'name' => 'Guru Read', 'email' => 'attendance-read@example.test', 'password' => Hash::make('Password!123'), 'role' => User::CLASS_TEACHER, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001']);
        \App\Models\SchoolClass::query()->create(['id' => '3a3a3a3a-3a3a-3a3a-3a3a-3a3a3a3a3a3a', 'kod_sekolah' => 'SRA001', 'tahun_akademik' => 2026, 'tahun' => 1, 'nama_kelas' => '1 Read', 'status' => 'AKTIF']);
        DB::table('teacher_class_assignments')->insert(['id' => '3b3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b3b', 'user_id' => $user->id, 'class_id' => '3a3a3a3a-3a3a-3a3a-3a3a-3a3a3a3a3a3a', 'created_at' => now(), 'updated_at' => now()]);
        $this->actingAs($user)->getJson('/api/attendance/context?attendance_date=2026-09-28')->assertOk()->assertJsonPath('classes.0.nama_kelas', '1 Read');
    }
}
