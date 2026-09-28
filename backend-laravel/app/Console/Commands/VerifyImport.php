<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use JsonException;

class VerifyImport extends Command
{
    protected $signature = 'emumtaz:verify-import {file : JSON export used for import} {--strict : Fail if a target count is lower than the source count}';
    protected $description = 'Compare Supabase export counts with the self-hosted Laravel database';

    public function handle(): int
    {
        $file = $this->argument('file');
        try {
            $payload = json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException|\ValueError $exception) {
            $this->error('Fail export tidak boleh dibaca: '.$exception->getMessage());
            return self::FAILURE;
        }
        if (!is_array($payload)) return $this->failure('Export mesti berupa objek JSON.');
        $rows = [];
        $failed = false;
        foreach ($payload as $sourceTable => $sourceRows) {
            if (!is_array($sourceRows)) continue;
            $targetTable = $sourceTable === 'app_users' ? 'users' : $sourceTable;
            if (!Schema::hasTable($targetTable)) {
                $rows[] = [$sourceTable, count($sourceRows), $targetTable, 'MISSING'];
                $failed = true;
                continue;
            }
            $targetCount = DB::table($targetTable)->count();
            $status = $targetCount >= count($sourceRows) ? 'PASS' : 'LOW';
            $rows[] = [$sourceTable, count($sourceRows), $targetTable, $targetCount.' '.$status];
            if ($status === 'LOW') $failed = true;
        }
        $this->table(['source', 'export', 'target', 'database'], $rows);
        if ($failed && $this->option('strict')) return $this->failure('Semakan import gagal.');
        if ($failed) $this->warn('Terdapat count yang lebih rendah; semak rekod ditapis atau import gagal.');
        else $this->info('Semua count sasaran sekurang-kurangnya menyamai export.');
        return self::SUCCESS;
    }

    private function failure(string $message): int
    {
        $this->error($message);
        return self::FAILURE;
    }
}
