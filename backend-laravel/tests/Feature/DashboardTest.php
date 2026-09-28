<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_shows_scoped_statistics(): void
    {
        $user = User::query()->create(['id' => '51515151-5151-5151-5151-515151515151', 'name' => 'Admin', 'email' => 'dashboard@example.test', 'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001']);
        \App\Models\School::query()->create(['id' => '52525252-5252-5252-5252-525252525252', 'kod_sekolah' => 'SRA001', 'nama_sekolah' => 'Sekolah', 'status' => 'AKTIF']);

        $this->actingAs($user)->get('/dashboard')->assertOk()->assertSee('Ringkasan')->assertSee('Sekolah');
    }
}
