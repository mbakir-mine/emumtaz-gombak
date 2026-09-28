<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SchoolApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_district_admin_can_create_school(): void
    {
        $user = User::query()->create([
            'id' => 'abababab-abab-abab-abab-abababababab', 'name' => 'Daerah', 'email' => 'daerah@example.test',
            'password' => Hash::make('Password!123'), 'role' => User::DISTRICT_ADMIN, 'status' => 'AKTIF',
        ]);

        $this->actingAs($user)->postJson('/api/schools', [
            'kod_sekolah' => 'SRA003', 'nama_sekolah' => 'Sekolah Baharu', 'zon' => 'BARAT',
        ])->assertCreated()->assertJsonPath('data.kod_sekolah', 'SRA003');
    }

    public function test_school_admin_cannot_create_school(): void
    {
        $user = User::query()->create([
            'id' => 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 'name' => 'Sekolah', 'email' => 'sekolah@example.test',
            'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001',
        ]);

        $this->actingAs($user)->postJson('/api/schools', [
            'kod_sekolah' => 'SRA004', 'nama_sekolah' => 'Tidak Dibenarkan',
        ])->assertForbidden();
    }
}
