<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ParentPortalWebTest extends TestCase
{
    use RefreshDatabase;

    public function test_parent_can_login_on_self_hosted_portal_and_see_report(): void
    {
        $admin = User::create(['id' => '45454545-4545-4545-4545-454545454545', 'name' => 'Admin Portal', 'email' => 'parent-portal@example.test', 'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001']);
        $student = Student::create(['id' => '46464646-4646-4646-4646-464646464646', 'mykid' => '260101010009', 'nama' => 'Murid Portal', 'kod_sekolah' => 'SRA001', 'status' => 'AKTIF']);
        $code = $this->actingAs($admin)->postJson('/api/parent/access-codes', ['student_id' => $student->id, 'valid_days' => 7])->json('code');
        $this->get('/ibu-bapa')->assertOk()->assertSee('Akses ibu bapa');
        $login = $this->post('/ibu-bapa/login', ['kod_sekolah' => 'SRA001', 'mykid' => $student->mykid, 'code' => $code])->assertRedirect(route('parent.portal'));
        $cookie = $login->getCookie('emumtaz_parent_session')->getValue();
        $this->withCookie('emumtaz_parent_session', $cookie)->get('/ibu-bapa/portal')->assertOk()->assertSee('Murid Portal');
        $this->assertDatabaseCount('parent_access_sessions', 1);
    }
}
