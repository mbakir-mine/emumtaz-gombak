<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SelfHostedAuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_self_hosted_auth_bridge_uses_laravel_session(): void
    {
        User::create(['id' => '49494949-4949-4949-4949-494949494949', 'name' => 'Bridge User', 'email' => 'bridge@example.test', 'password' => Hash::make('Password!123'), 'role' => User::SCHOOL_ADMIN, 'status' => 'AKTIF', 'kod_sekolah' => 'SRA001']);
        $login = $this->postJson('/api/auth/login', ['email' => 'bridge@example.test', 'password' => 'Password!123'])->assertOk()->assertJsonPath('ok', true);
        $this->getJson('/api/auth/session')->assertOk()->assertJsonPath('authenticated', true);
    }
}
