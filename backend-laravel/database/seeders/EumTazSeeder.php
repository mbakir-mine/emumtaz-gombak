<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EumTazSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('EMUMTAZ_OWNER_EMAIL');
        $password = env('EMUMTAZ_OWNER_PASSWORD');
        if (! is_string($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL) || ! is_string($password) || strlen($password) < 12) {
            $this->command?->warn('Owner seed dilangkau. Tetapkan EMUMTAZ_OWNER_EMAIL dan EMUMTAZ_OWNER_PASSWORD (minimum 12 aksara).');
            return;
        }

        User::query()->updateOrCreate(
            ['email' => strtolower($email)],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Pemilik Sistem',
                'password' => Hash::make($password),
                'role' => User::OWNER,
                'status' => 'AKTIF',
                'must_change_password' => false,
            ],
        );
        $this->command?->info('Owner e-Mumtaz berjaya disediakan.');
    }
}
