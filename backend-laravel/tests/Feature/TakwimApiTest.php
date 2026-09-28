<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TakwimApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_school_admin_can_create_and_read_school_calendar_event(): void
    {
        $user = User::create(['id' => '4b4b4b4b-4b4b-4b4b-4b4b-4b4b4b4b4b4b', 'name' => 'Takwim Admin', 'email' => 'takwim@example.test', 'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA007']);
        School::create(['id' => '4c4c4c4c-4c4c-4c4c-4c4c-4c4c4c4c4c4c', 'kod_sekolah' => 'SRA007', 'nama_sekolah' => 'Sekolah Takwim', 'status' => 'AKTIF']);
        $this->actingAs($user)->postJson('/api/takwim', ['tahun_akademik' => 2026, 'kod_sekolah' => 'SRA007', 'kategori' => 'PROGRAM', 'tajuk' => 'Hari Terbuka', 'tarikh_mula' => '2026-10-01', 'tarikh_tamat' => '2026-10-01'])->assertCreated();
        $this->actingAs($user)->getJson('/api/takwim')->assertOk()->assertJsonPath('data.0.tajuk', 'Hari Terbuka');
    }
}
