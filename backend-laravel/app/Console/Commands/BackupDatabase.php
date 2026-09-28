<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;

class BackupDatabase extends Command
{
    protected $signature = 'emumtaz:backup {--path= : Folder tujuan backup} {--retention= : Bilangan hari untuk simpan backup lama}';
    protected $description = 'Membina backup database e-Mumtaz';

    public function handle(): int
    {
        $connection = config('database.default');
        $folder = $this->option('path') ?: storage_path('app/private/backups');
        File::ensureDirectoryExists($folder);
        $filename = 'emumtaz-'.$connection.'-'.now()->format('Ymd-His');

        if ($connection === 'sqlite') {
            $source = config('database.connections.sqlite.database');
            $target = $folder.DIRECTORY_SEPARATOR.$filename.'.sqlite';
            File::copy($source, $target);
        } elseif (in_array($connection, ['mysql', 'mariadb'], true)) {
            $target = $folder.DIRECTORY_SEPARATOR.$filename.'.sql';
            $db = config('database.connections.'.$connection);
            $dumpBinary = env('DB_DUMP_BIN') ?: 'mysqldump';
            $command = [$dumpBinary, '--single-transaction', '--routines', '--host='.$db['host'], '--port='.$db['port'], '--user='.$db['username']];
            if ($db['password'] !== '') {
                $command[] = '--password='.$db['password'];
            }
            $command[] = $db['database'];
            $process = new Process($command);
            $process->run();
            if (! $process->isSuccessful()) {
                $this->error('Backup gagal: '.$process->getErrorOutput());
                return self::FAILURE;
            }
            File::put($target, $process->getOutput());
        } else {
            $this->error('Driver database belum disokong: '.$connection);
            return self::FAILURE;
        }

        $this->purgeOldBackups($folder, (int) ($this->option('retention') ?: env('BACKUP_RETENTION_DAYS', 30)));
        $this->info('Backup berjaya: '.$target);
        return self::SUCCESS;
    }

    private function purgeOldBackups(string $folder, int $retentionDays): void
    {
        if ($retentionDays < 1) return;
        $cutoff = now()->subDays($retentionDays)->getTimestamp();
        foreach (File::files($folder) as $file) {
            if (in_array($file->getExtension(), ['sql', 'sqlite'], true) && $file->getMTime() < $cutoff) {
                File::delete($file->getPathname());
            }
        }
    }
}
