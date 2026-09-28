<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SchoolModuleApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_school_admin_can_toggle_only_own_school_module(): void
    {
        $admin = User::create(['id' => '81818181-8181-8181-8181-818181818181', 'name' => 'Admin Modul', 'email' => 'module@example.test', 'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA005']);
        School::create(['id' => '82828282-8282-8282-8282-828282828282', 'kod_sekolah' => 'SRA005', 'nama_sekolah' => 'Sekolah Modul', 'status' => 'AKTIF']);
        School::create(['id' => '83838383-8383-8383-8383-838383838383', 'kod_sekolah' => 'SRA006', 'nama_sekolah' => 'Sekolah Lain', 'status' => 'AKTIF']);
        $this->actingAs($admin)->postJson('/api/school-modules', ['kod_sekolah' => 'SRA005', 'module_key' => 'TAKWIM', 'enabled' => true])->assertCreated();
        $this->actingAs($admin)->postJson('/api/school-modules', ['kod_sekolah' => 'SRA006', 'module_key' => 'TAKWIM', 'enabled' => true])->assertForbidden();
        $this->assertDatabaseHas('school_module_access', ['kod_sekolah' => 'SRA005', 'module_key' => 'TAKWIM', 'enabled' => 1]);
    }
}
