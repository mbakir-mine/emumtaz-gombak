<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_read_school_notification_and_mark_it_read(): void
    {
        $user = User::create(['id' => '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', 'name' => 'Notifikasi Guru', 'email' => 'notification@example.test', 'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA008']);
        School::create(['id' => '4e4e4e4e-4e4e-4e4e-4e4e-4e4e4e4e4e4e', 'kod_sekolah' => 'SRA008', 'nama_sekolah' => 'Sekolah Notifikasi', 'status' => 'AKTIF']);
        $id = (string) Str::uuid();
        DB::table('user_notifications')->insert(['id' => $id, 'kod_sekolah' => 'SRA008', 'target_roles' => json_encode(['ADMIN_SEKOLAH']), 'type' => 'SYSTEM', 'title' => 'Ujian', 'message' => 'Notifikasi ujian', 'created_at' => now(), 'updated_at' => now()]);
        $this->actingAs($user)->getJson('/api/notifications')->assertOk()->assertJsonPath('data.0.title', 'Ujian');
        $this->actingAs($user)->postJson('/api/notifications/'.$id.'/read')->assertOk()->assertJsonPath('ok', true);
        $this->assertDatabaseHas('user_notification_reads', ['notification_id' => $id, 'user_id' => $user->id]);
    }
}
