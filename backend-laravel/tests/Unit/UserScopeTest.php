<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class UserScopeTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function active_school_users_are_scoped_to_their_school(): void
    {
        $user = new User(['status' => 'AKTIF', 'role' => User::SCHOOL_ADMIN, 'kod_sekolah' => 'SRA001']);

        $this->assertTrue($user->canAccessSchool('SRA001'));
        $this->assertFalse($user->canAccessSchool('SRA002'));
    }

    #[Test]
    public function owner_and_district_admin_can_access_school_scope(): void
    {
        foreach ([User::OWNER, User::DISTRICT_ADMIN] as $role) {
            $user = new User(['status' => 'AKTIF', 'role' => $role]);
            $this->assertTrue($user->canAccessSchool('SRA001'));
        }
    }

    #[Test]
    public function inactive_users_cannot_access_any_school(): void
    {
        $user = new User(['status' => 'MENUNGGU', 'role' => User::OWNER]);

        $this->assertFalse($user->canAccessSchool('SRA001'));
    }

    public function test_zone_admin_can_access_only_active_schools_in_own_zone(): void
    {
        School::query()->create(['id' => '10101010-1010-1010-1010-101010101010', 'kod_sekolah' => 'SRA001', 'nama_sekolah' => 'Barat', 'zon' => 'BARAT', 'status' => 'AKTIF']);
        School::query()->create(['id' => '20202020-2020-2020-2020-202020202020', 'kod_sekolah' => 'SRA002', 'nama_sekolah' => 'Timur', 'zon' => 'TIMUR', 'status' => 'AKTIF']);
        $user = new User(['status' => 'AKTIF', 'role' => User::ZONE_ADMIN, 'zon' => 'BARAT']);

        $this->assertTrue($user->canAccessSchool('SRA001'));
        $this->assertFalse($user->canAccessSchool('SRA002'));
    }
}
