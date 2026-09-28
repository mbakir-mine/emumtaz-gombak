<?php

namespace Tests\Feature;

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AttendanceWebTest extends TestCase
{
    use RefreshDatabase;

    public function test_class_teacher_can_open_and_save_attendance_page(): void
    {
        $user = User::create(['id' => '35353535-3535-3535-3535-353535353535', 'name' => 'Guru Web', 'email' => 'attendance-web@example.test', 'password' => Hash::make('Password!123'), 'role' => User::CLASS_TEACHER, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001']);
        $class = SchoolClass::create(['id' => '36363636-3636-3636-3636-363636363636', 'kod_sekolah' => 'SRA001', 'tahun_akademik' => 2026, 'tahun' => 1, 'nama_kelas' => '1 Web', 'status' => 'AKTIF']);
        $student = Student::create(['id' => '37373737-3737-3737-3737-373737373737', 'mykid' => '260101010008', 'nama' => 'Murid Web', 'kod_sekolah' => 'SRA001', 'class_id' => $class->id, 'status' => 'AKTIF']);
        DB::table('teacher_class_assignments')->insert(['id' => '38383838-3838-3838-3838-383838383838', 'user_id' => $user->id, 'class_id' => $class->id, 'created_at' => now(), 'updated_at' => now()]);

        $this->actingAs($user)->get('/admin/attendance?class_id='.$class->id.'&attendance_date=2026-09-28')->assertOk()->assertSee('Murid Web');
        $this->actingAs($user)->post('/admin/attendance', ['class_id' => $class->id, 'attendance_date' => '2026-09-28', 'status' => [$student->id => 'LEWAT'], 'catatan' => [$student->id => 'Tiba 7:45']])->assertRedirect();
        $this->assertDatabaseHas('daily_attendance', ['student_id' => $student->id, 'status' => 'LEWAT', 'catatan' => 'Tiba 7:45']);
    }
}
