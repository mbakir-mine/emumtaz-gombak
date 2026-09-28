<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_inactive_users_cannot_login(): void
    {
        $user = User::query()->create([
            'id' => '11111111-1111-1111-1111-111111111111',
            'name' => 'Menunggu',
            'email' => 'menunggu@example.test',
            'password' => Hash::make('Password!123'),
            'role' => User::SCHOOL_ADMIN,
            'status' => 'MENUNGGU',
        ]);

        $this->post('/login', ['email' => $user->email, 'password' => 'Password!123'])
            ->assertSessionHasErrors('email');
        $this->assertDatabaseCount('auth_login_failure_logs', 1);
    }

    public function test_active_users_can_login_and_logout(): void
    {
        $user = User::query()->create([
            'id' => '22222222-2222-2222-2222-222222222222',
            'name' => 'Aktif',
            'email' => 'aktif@example.test',
            'password' => Hash::make('Password!123'),
            'role' => User::SCHOOL_ADMIN,
            'status' => 'AKTIF',
        ]);

        $this->post('/login', ['email' => $user->email, 'password' => 'Password!123'])
            ->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
        $this->get('/dashboard')->assertOk()->assertSee('Dashboard')->assertSee('Pengurusan sekolah yang lebih tersusun');
        $this->post('/logout')->assertRedirect('/login');
        $this->assertGuest();
        $this->assertDatabaseHas('auth_activity_logs', ['actor_profile_id' => $user->id, 'event_type' => 'LOGIN']);
        $this->assertDatabaseHas('auth_activity_logs', ['actor_profile_id' => $user->id, 'event_type' => 'LOGOUT']);
    }
}
