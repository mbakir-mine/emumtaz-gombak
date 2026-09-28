<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ClassApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_school_admin_can_create_class_only_for_own_school(): void
    {
        $user = User::query()->create([
            'id' => 'abababab-abab-abab-abab-abababababab', 'name' => 'Admin', 'email' => 'class-admin@example.test',
            'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001',
        ]);
        \App\Models\School::query()->create(['id' => 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 'kod_sekolah' => 'SRA001', 'nama_sekolah' => 'Sekolah', 'status' => 'AKTIF']);

        $this->actingAs($user)->postJson('/api/classes', [
            'kod_sekolah' => 'SRA001', 'tahun_akademik' => 2026, 'tahun' => 1, 'nama_kelas' => '1 Amanah',
        ])->assertCreated();

        $this->actingAs($user)->postJson('/api/classes', [
            'kod_sekolah' => 'SRA002', 'tahun_akademik' => 2026, 'tahun' => 1, 'nama_kelas' => '1 Lain',
        ])->assertUnprocessable();
    }
}
