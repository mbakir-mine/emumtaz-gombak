<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LicenseApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_school_license(): void
    {
        $owner = User::create(['id' => '71717171-7171-7171-7171-717171717171', 'name' => 'Owner', 'email' => 'license-owner@example.test', 'password' => Hash::make('Password!123'), 'role' => User::OWNER, 'status' => 'AKTIF']);
        School::create(['id' => '72727272-7272-7272-7272-727272727272', 'kod_sekolah' => 'SRA004', 'nama_sekolah' => 'Sekolah Lesen', 'status' => 'AKTIF']);
        $this->actingAs($owner)->postJson('/api/licenses', ['kod_sekolah' => 'SRA004', 'plan_code' => 'PRO', 'status' => 'AKTIF', 'starts_on' => '2026-01-01', 'ends_on' => '2026-12-31'])->assertCreated();
        $this->assertDatabaseHas('school_licenses', ['kod_sekolah' => 'SRA004', 'plan_code' => 'PRO']);
    }
}
