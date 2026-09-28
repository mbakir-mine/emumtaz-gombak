<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ParentAccessApiTest extends TestCase
{
    use RefreshDatabase;

    private function seedAdminAndStudent(): array
    {
        $admin = User::query()->create(['id' => '41414141-4141-4141-4141-414141414141', 'name' => 'Admin', 'email' => 'parent-admin@example.test', 'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001']);
        $student = Student::query()->create(['id' => '42424242-4242-4242-4242-424242424242', 'mykid' => '260101010007', 'nama' => 'Murid Parent', 'kod_sekolah' => 'SRA001', 'status' => 'AKTIF']);
        return [$admin, $student];
    }

    public function test_admin_can_issue_code_and_parent_can_read_report(): void
    {
        [$admin, $student] = $this->seedAdminAndStudent();
        $issued = $this->actingAs($admin)->postJson('/api/parent/access-codes', ['student_id' => $student->id, 'valid_days' => 7])->assertCreated();
        $code = $issued->json('code');

        $login = $this->postJson('/api/parent/login', ['kod_sekolah' => 'SRA001', 'mykid' => $student->mykid, 'code' => $code])->assertOk();
        $this->assertNotNull($login->getCookie('emumtaz_parent_session'));
        $this->assertDatabaseCount('parent_access_sessions', 1);
        $this->assertDatabaseHas('parent_access_events', ['student_id' => $student->id, 'event_type' => 'BERJAYA']);
    }

    public function test_parent_report_requires_a_valid_session(): void
    {
        [, $student] = $this->seedAdminAndStudent();
        $this->getJson('/api/parent/report')->assertUnauthorized();
        $this->postJson('/api/parent/login', ['kod_sekolah' => 'SRA001', 'mykid' => $student->mykid, 'code' => 'ABCDEFGH'])->assertUnauthorized();
        $this->assertDatabaseHas('parent_access_events', ['student_id' => $student->id, 'event_type' => 'GAGAL']);
    }
}
