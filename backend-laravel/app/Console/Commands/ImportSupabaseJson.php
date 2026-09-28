<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use JsonException;

class ImportSupabaseJson extends Command
{
    protected $signature = 'emumtaz:import-json
        {file : JSON export containing table arrays}
        {--dry-run : Validate and count records without writing}
        {--only=* : Import only the named table keys}';

    protected $description = 'Import an e-Mumtaz Supabase JSON export into the Laravel database';

    /** @var list<string> */
    private array $order = [
        'schools', 'app_users', 'classes', 'students', 'subjects', 'exams',
        'teacher_class_assignments', 'teacher_subject_assignments', 'grade_scales', 'marks',
        'daily_attendance', 'pbd_assessments', 'pbd_marks', 'school_module_access',
        'parent_access_codes', 'parent_access_sessions', 'user_notification_reads',
        'subject_components', 'mark_components', 'teacher_subject_component_assignments',
        'timetable_slots', 'timetable_entries', 'timetable_requirements', 'rph_records',
        'amal_khair_categories', 'amal_khair_records', 'takwim_events',
        'school_licenses', 'mark_submission_workflows', 'user_notifications',
        'report_verifications', 'rph_topic_bank', 'rph_weekly_submissions',
        'rph_weekly_submission_items', 'rph_weekly_reviews', 'auth_activity_logs',
        'auth_login_failure_logs', 'parent_access_events', 'security_audit_logs',
        'upkk_amali_solat_marks', 'upkk_pchi_marks', 'psra_trial_marks', 'psra_trial_paper_marks',
        'upkk_trial_grade_settings', 'upkk_trial_paper_marks', 'khalifah_muda_components',
        'khalifah_muda_records', 'sahsiah_ihab_assessments', 'student_enrollments',
        'student_transfer_logs', 'subject_component_mark_settings', 'school_subject_mark_settings',
        'school_subject_component_mark_settings',
        'subject_grade_rules', 'system_settings',
    ];

    public function handle(): int
    {
        $file = $this->argument('file');
        if (! is_string($file) || ! is_file($file)) {
            $this->error("Fail export tidak ditemui: {$file}");
            return self::FAILURE;
        }

        try {
            $payload = json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            $this->error('JSON tidak sah: '.$exception->getMessage());
            return self::FAILURE;
        }

        if (! is_array($payload)) {
            $this->error('Export mesti berupa objek JSON dengan setiap key mengandungi array rekod.');
            return self::FAILURE;
        }

        $only = array_values(array_filter((array) $this->option('only')));
        $selected = $only === [] ? $this->order : array_values(array_intersect($this->order, $only));
        $unknown = array_diff($only, $this->order);
        if ($unknown !== []) {
            $this->error('Table tidak disokong: '.implode(', ', $unknown));
            return self::FAILURE;
        }

        $counts = [];
        foreach ($selected as $table) {
            $rows = $payload[$table] ?? [];
            if (! is_array($rows)) {
                $this->error("Key {$table} mesti mengandungi array.");
                return self::FAILURE;
            }
            $counts[$table] = count($rows);
        }

        $this->table(['table', 'records'], array_map(
            fn (string $table): array => [$table, $counts[$table]],
            $selected,
        ));
        if ($this->option('dry-run')) {
            $this->info('Dry-run selesai. Tiada data ditulis.');
            return self::SUCCESS;
        }

        $authMap = [];
        foreach (($payload['app_users'] ?? []) as $profile) {
            if (is_array($profile) && isset($profile['auth_user_id'], $profile['id'])) $authMap[(string) $profile['auth_user_id']] = (string) $profile['id'];
        }
        DB::transaction(function () use ($payload, $selected, $authMap): void {
            foreach ($selected as $table) {
                $rows = array_values(array_filter($payload[$table] ?? [], 'is_array'));
                if ($rows === []) {
                    continue;
                }

                foreach (array_chunk($this->normalise($table, $rows, $authMap), 250) as $chunk) {
                    DB::table($this->destination($table))->upsert(
                        $chunk,
                        $this->uniqueBy($table),
                        $this->updateColumns($table, $chunk[0]),
                    );
                }
            }
        });

        $this->info('Import berjaya. Password pengguna diimport sebagai reset wajib; pengguna perlu menetapkan password baharu.');
        return self::SUCCESS;
    }

    /** @param list<array<string, mixed>> $rows */
    private function normalise(string $table, array $rows, array $authMap = []): array
    {
        return array_values(array_filter(array_map(function (array $row) use ($table, $authMap): array {
            if ($table === 'app_users') {
                $row['name'] = $row['nama'] ?? $row['name'] ?? '';
                unset($row['nama'], $row['auth_user_id']);
                $row['password'] = Hash::make(Str::random(48));
                $row['must_change_password'] = true;
            }
            if ($table === 'students' && isset($row['nama_murid']) && ! isset($row['nama'])) {
                $row['nama'] = $row['nama_murid'];
            }
            if ($table === 'students') {
                unset($row['nama_murid']);
            }
            if ($table === 'user_notification_reads') {
                $row['user_id'] = $authMap[(string) ($row['auth_user_id'] ?? '')] ?? null;
                unset($row['auth_user_id']);
                if (! $row['user_id']) return [];
            }
            if (in_array($table, ['upkk_amali_solat_marks', 'upkk_pchi_marks'], true) && isset($row['student_id'])) {
                $row['student_mykid'] = (string) $row['student_id'];
                unset($row['student_id']);
            }
            if ($table === 'classes' && ! isset($row['school_id'])) {
                $row['school_id'] = null;
            }
            if ($table === 'user_notifications') {
                $row['target_roles'] = is_array($row['target_roles'] ?? null)
                    ? json_encode($row['target_roles'], JSON_THROW_ON_ERROR)
                    : ($row['target_roles'] ?? '[]');
            }
            unset($row['created_at'], $row['updated_at']);
            $row['created_at'] = $row['created_at'] ?? now();
            if (! in_array($table, ['auth_login_failure_logs', 'parent_access_events', 'security_audit_logs', 'auth_activity_logs'], true)) {
                $row['updated_at'] = $row['updated_at'] ?? now();
            }
            return $row;
        }, $rows), fn (array $row): bool => $row !== []));
    }

    private function destination(string $table): string
    {
        return $table === 'app_users' ? 'users' : $table;
    }

    /** @return list<string> */
    private function uniqueBy(string $table): array
    {
        return match ($table) {
            'schools' => ['kod_sekolah'],
            'app_users' => ['id'],
            'classes', 'students', 'subjects', 'exams', 'grade_scales', 'marks',
            'teacher_class_assignments', 'teacher_subject_assignments', 'school_licenses',
            'mark_submission_workflows' => ['id'],
            'daily_attendance' => ['id'],
            'parent_access_codes', 'parent_access_sessions' => ['id'],
            'user_notification_reads' => ['notification_id', 'user_id'],
            'pbd_assessments', 'pbd_marks', 'school_module_access', 'subject_components',
            'mark_components', 'teacher_subject_component_assignments', 'timetable_slots',
            'timetable_entries', 'timetable_requirements', 'rph_records', 'amal_khair_records',
            'takwim_events' => ['id'],
            'amal_khair_categories' => ['id'],
            'user_notifications', 'report_verifications', 'rph_topic_bank',
            'rph_weekly_submissions', 'rph_weekly_submission_items', 'rph_weekly_reviews' => ['id'],
            'auth_activity_logs', 'auth_login_failure_logs', 'parent_access_events', 'security_audit_logs' => ['id'],
            'upkk_amali_solat_marks', 'upkk_pchi_marks' => ['id'],
            'psra_trial_marks', 'psra_trial_paper_marks', 'upkk_trial_paper_marks' => ['id'],
            'upkk_trial_grade_settings' => ['kod_sekolah'],
            'khalifah_muda_components', 'khalifah_muda_records', 'sahsiah_ihab_assessments' => ['id'],
            'student_enrollments', 'student_transfer_logs', 'subject_component_mark_settings',
            'school_subject_mark_settings', 'school_subject_component_mark_settings' => ['id'],
            'subject_grade_rules' => ['id'],
            'system_settings' => ['key'],
        };
    }

    /** @param array<string, mixed> $row @return list<string> */
    private function updateColumns(string $table, array $row): array
    {
        return array_values(array_diff(array_keys($row), ['id', 'created_at']));
    }
}
