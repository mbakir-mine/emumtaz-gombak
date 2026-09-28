<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrationStatus extends Command
{
    protected $signature = 'emumtaz:status';
    protected $description = 'Semak readiness backend self-hosted e-Mumtaz';

    public function handle(): int
    {
        $this->table(['item', 'value'], [
            ['Laravel', app()->version()],
            ['PHP', PHP_VERSION],
            ['Environment', app()->environment()],
            ['Database driver', config('database.default')],
            ['Timezone', config('app.timezone')],
            ['Supabase runtime key', 'tidak diperlukan'],
            ['Vercel runtime key', 'tidak diperlukan'],
        ]);

        $tables = ['users', 'schools', 'classes', 'students', 'subjects', 'exams', 'marks', 'pbd_assessments', 'daily_attendance', 'parent_access_sessions', 'school_licenses', 'mark_submission_workflows', 'user_notifications', 'report_verifications', 'rph_topic_bank', 'rph_weekly_submissions', 'auth_activity_logs', 'auth_login_failure_logs', 'parent_access_events', 'security_audit_logs', 'school_module_access', 'amal_khair_records', 'timetable_slots', 'timetable_entries', 'timetable_requirements', 'rph_records', 'subject_components', 'mark_components', 'takwim_events', 'upkk_amali_solat_marks', 'upkk_pchi_marks', 'psra_trial_marks', 'psra_trial_paper_marks', 'upkk_trial_grade_settings', 'upkk_trial_paper_marks', 'khalifah_muda_components', 'khalifah_muda_records', 'sahsiah_ihab_assessments', 'student_enrollments', 'student_transfer_logs', 'subject_component_mark_settings', 'school_subject_mark_settings', 'school_subject_component_mark_settings', 'subject_grade_rules', 'system_settings'];
        $rows = [];
        foreach ($tables as $table) {
            try {
                $rows[] = [$table, DB::table($table)->count()];
            } catch (\Throwable) {
                $rows[] = [$table, 'MISSING'];
            }
        }
        $this->table(['table', 'records'], $rows);
        return collect($rows)->contains(fn (array $row): bool => $row[1] === 'MISSING') ? self::FAILURE : self::SUCCESS;
    }
}
