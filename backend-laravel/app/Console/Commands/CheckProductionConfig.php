<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckProductionConfig extends Command
{
    protected $signature = 'emumtaz:check-production {--strict : Gagal jika konfigurasi belum sesuai production}';
    protected $description = 'Semak konfigurasi keselamatan dan deployment production e-Mumtaz';

    public function handle(): int
    {
        $checks = [
            'APP_KEY tersedia' => (bool) config('app.key'),
            'APP_DEBUG dimatikan' => config('app.debug') === false,
            'APP_URL menggunakan HTTPS' => str_starts_with((string) config('app.url'), 'https://'),
            'Database production bukan SQLite' => ! in_array(config('database.default'), ['sqlite', ''], true),
            'Owner email dikonfigurasi' => filter_var(env('EMUMTAZ_OWNER_EMAIL'), FILTER_VALIDATE_EMAIL) !== false,
            'Owner password minimum 12 aksara' => strlen((string) env('EMUMTAZ_OWNER_PASSWORD')) >= 12,
        ];
        foreach ($checks as $label => $passed) {
            $this->line(($passed ? '<fg=green>PASS</>' : '<fg=red>FAIL</>').' '.$label);
        }
        $failed = count(array_filter($checks, fn (bool $passed): bool => ! $passed));
        if ($failed && $this->option('strict')) {
            $this->error("$failed semakan gagal.");
            return self::FAILURE;
        }
        if ($failed) $this->warn("$failed semakan belum sesuai production; ini normal untuk local development.");
        return self::SUCCESS;
    }
}
