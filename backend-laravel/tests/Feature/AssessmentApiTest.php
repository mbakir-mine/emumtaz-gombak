<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AssessmentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_save_psra_paper_for_year_six_student(): void
    {
        $user = User::create(['id' => '51515151-5151-5151-5151-515151515151', 'name' => 'Guru', 'email' => 'assessment@example.test', 'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001']);
        School::create(['id' => '52525252-5252-5252-5252-525252525252', 'kod_sekolah' => 'SRA001', 'nama_sekolah' => 'Sekolah Ujian', 'status' => 'AKTIF']);
        $class = SchoolClass::create(['id' => '53535353-5353-5353-5353-535353535353', 'kod_sekolah' => 'SRA001', 'tahun_akademik' => 2026, 'tahun' => 6, 'nama_kelas' => '6 Amanah', 'status' => 'AKTIF']);
        $student = Student::create(['id' => '54545454-5454-5454-5454-545454545454', 'kod_sekolah' => 'SRA001', 'class_id' => $class->id, 'mykid' => '260101010001', 'nama' => 'Calon PSRA', 'status' => 'AKTIF']);

        $this->actingAs($user)->postJson('/api/assessments/psra/papers', ['kod_sekolah' => 'SRA001', 'tahun_akademik' => 2026, 'class_id' => $class->id, 'student_id' => $student->id, 'sesi' => 1, 'paper_code' => 'AS01', 'markah' => 88])->assertCreated();
        $this->assertDatabaseHas('psra_trial_paper_marks', ['student_id' => $student->id, 'paper_code' => 'AS01', 'markah' => 88]);
    }

    public function test_upkk_rejects_non_year_five_class(): void
    {
        $user = User::create(['id' => '55555555-5555-5555-5555-555555555555', 'name' => 'Guru', 'email' => 'upkk@example.test', 'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA002']);
        School::create(['id' => '56565656-5656-5656-5656-565656565656', 'kod_sekolah' => 'SRA002', 'nama_sekolah' => 'Sekolah Ujian 2', 'status' => 'AKTIF']);
        $class = SchoolClass::create(['id' => '57575757-5757-5757-5757-575757575757', 'kod_sekolah' => 'SRA002', 'tahun_akademik' => 2026, 'tahun' => 4, 'nama_kelas' => '4 Bestari', 'status' => 'AKTIF']);
        $student = Student::create(['id' => '58585858-5858-5858-5858-585858585858', 'kod_sekolah' => 'SRA002', 'class_id' => $class->id, 'mykid' => '260101010002', 'nama' => 'Bukan Calon', 'status' => 'AKTIF']);

        $this->actingAs($user)->postJson('/api/assessments/upkk/papers', ['kod_sekolah' => 'SRA002', 'tahun_akademik' => 2026, 'class_id' => $class->id, 'student_id' => $student->id, 'paper_code' => 'UPKK02', 'markah' => 80])->assertStatus(422);
    }

    public function test_upkk_context_and_grade_settings_use_laravel_database(): void
    {
        $user = User::create(['id' => '59595959-5959-5959-5959-595959595959', 'name' => 'Admin', 'email' => 'upkk-context@example.test', 'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA004']);
        School::create(['id' => '60606060-6060-6060-6060-606060606060', 'kod_sekolah' => 'SRA004', 'nama_sekolah' => 'Sekolah Konteks', 'status' => 'AKTIF']);
        $class = SchoolClass::create(['id' => '61616161-6161-6161-6161-616161616161', 'kod_sekolah' => 'SRA004', 'tahun_akademik' => 2026, 'tahun' => 5, 'nama_kelas' => '5 Konteks', 'status' => 'AKTIF']);
        $student = Student::create(['id' => '62626262-6262-6262-6262-626262626262', 'kod_sekolah' => 'SRA004', 'class_id' => $class->id, 'mykid' => '260101010004', 'nama' => 'Calon Konteks', 'status' => 'AKTIF']);
        $this->actingAs($user)->postJson('/api/assessments/upkk/papers', ['kod_sekolah' => 'SRA004', 'tahun_akademik' => 2026, 'class_id' => $class->id, 'student_id' => $student->id, 'sesi' => 2, 'paper_code' => 'UPKK02', 'markah' => 90])->assertCreated();
        $this->actingAs($user)->postJson('/api/assessments/upkk/grades', ['kod_sekolah' => 'SRA004', 'grade_a_min' => 90, 'grade_b_min' => 70, 'grade_c_min' => 50])->assertOk();
        $this->actingAs($user)->getJson('/api/assessments/upkk/context?kod_sekolah=SRA004&tahun_akademik=2026&class_id='.$class->id.'&sesi=2')->assertOk()->assertJsonPath('grades.grade_a_min', 90)->assertJsonPath('trial.0.paper_code', 'UPKK02');
        $this->assertDatabaseHas('upkk_trial_grade_settings', ['kod_sekolah' => 'SRA004', 'grade_a_min' => 90]);
    }
}
