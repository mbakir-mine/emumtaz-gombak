<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_reports_database_and_schema_ready(): void
    {
        $this->getJson('/health')->assertOk()->assertJsonPath('status', 'ok')->assertJsonPath('schema', 'ready');
    }
}
