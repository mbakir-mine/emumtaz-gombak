<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_imported_user_can_clear_must_change_password(): void
    {
        $user = User::query()->create(['id' => '61616161-6161-6161-6161-616161616161', 'name' => 'Import', 'email' => 'change@example.test', 'password' => Hash::make('Temporary!123'), 'role' => User::SUBJECT_TEACHER, 'status' => 'AKTIF', 'must_change_password' => true]);

        $this->actingAs($user)->post('/change-password', ['current_password' => 'Temporary!123', 'password' => 'NewSecure!123', 'password_confirmation' => 'NewSecure!123'])->assertRedirect('/dashboard');
        $this->assertFalse($user->fresh()->must_change_password);
        $this->assertTrue(Hash::check('NewSecure!123', $user->fresh()->password));
    }
}
