<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerifyImportCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_strict_verification_fails_before_export_is_imported(): void
    {
        $this->artisan('emumtaz:verify-import', ['file' => base_path('tests/Fixtures/supabase-export.json'), '--strict' => true])
            ->assertExitCode(1)
            ->expectsOutputToContain('Semakan import gagal.');
    }
}
