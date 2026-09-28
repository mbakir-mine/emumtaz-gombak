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

class CharacterAssessmentApiTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(): array
    {
        $user = User::create(['id' => '61616161-6161-6161-6161-616161616161', 'name' => 'Guru Sahsiah', 'email' => 'character@example.test', 'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA003']);
        School::create(['id' => '62626262-6262-6262-6262-626262626262', 'kod_sekolah' => 'SRA003', 'nama_sekolah' => 'Sekolah Karakter', 'status' => 'AKTIF']);
        $class = SchoolClass::create(['id' => '63636363-6363-6363-6363-636363636363', 'kod_sekolah' => 'SRA003', 'tahun_akademik' => 2026, 'tahun' => 6, 'nama_kelas' => '6 Ikhlas', 'status' => 'AKTIF']);
        $student = Student::create(['id' => '64646464-6464-6464-6464-646464646464', 'kod_sekolah' => 'SRA003', 'class_id' => $class->id, 'mykid' => '260101010003', 'nama' => 'Murid Karakter', 'status' => 'AKTIF']);
        DB::table('school_module_access')->insert(['id' => '65656565-6565-6565-6565-656565656565', 'kod_sekolah' => 'SRA003', 'module_key' => 'KHALIFAH_MUDA', 'enabled' => true, 'enabled_at' => now()]);
        return [$user, $class, $student];
    }

    public function test_school_admin_can_save_khalifah_record(): void
    {
        [$user, $class, $student] = $this->fixture();
        $this->actingAs($user)->postJson('/api/character/khalifah-muda', ['kod_sekolah' => 'SRA003', 'class_id' => $class->id, 'student_id' => $student->id, 'record_date' => '2026-09-28', 'record_scope' => 'INDIVIDU', 'record_kind' => 'POSITIF', 'domain' => 'Adab', 'indicator_key' => 'salam', 'indicator_label' => 'Memberi salam', 'points' => 1])->assertCreated();
        $this->assertDatabaseHas('khalifah_muda_records', ['student_id' => $student->id, 'indicator_key' => 'salam']);
    }

    public function test_school_admin_can_save_sahsiah_assessment(): void
    {
        [$user, $class, $student] = $this->fixture();
        $this->actingAs($user)->postJson('/api/character/sahsiah-ihab', ['kod_sekolah' => 'SRA003', 'tahun_akademik' => 2026, 'bulan' => 9, 'class_id' => $class->id, 'student_id' => $student->id, 'm3_raw' => 300, 'm3_percent' => 93.8, 'm4' => 14, 'm5' => 90, 'm6' => 88, 'total_score' => 91.2, 'grade' => 'Mumtaz', 'band' => 6])->assertCreated();
        $this->assertDatabaseHas('sahsiah_ihab_assessments', ['student_id' => $student->id, 'bulan' => 9, 'band' => 6]);
    }
}
