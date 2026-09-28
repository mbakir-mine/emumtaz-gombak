import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const output = resolve(process.argv[2] ?? 'outputs/emumtaz-supabase-export.json');
const pageSize = 1000;
const tables = [
  'schools', 'app_users', 'classes', 'students', 'subjects', 'exams',
  'teacher_class_assignments', 'teacher_subject_assignments', 'grade_scales', 'marks',
  'daily_attendance', 'pbd_assessments', 'pbd_marks', 'school_module_access',
  'parent_access_codes', 'parent_access_sessions', 'user_notification_reads',
  'subject_components', 'mark_components', 'teacher_subject_component_assignments',
  'timetable_slots', 'timetable_entries', 'timetable_requirements', 'rph_records',
  'amal_khair_categories', 'amal_khair_records', 'takwim_events',
  'school_licenses', 'mark_submission_workflows', 'user_notifications',
  'report_verifications', 'rph_topic_bank', 'rph_weekly_submissions',
  'rph_weekly_submission_items', 'rph_weekly_reviews',
  'auth_activity_logs', 'auth_login_failure_logs', 'parent_access_events', 'security_audit_logs',
  'upkk_amali_solat_marks', 'upkk_pchi_marks', 'psra_trial_marks', 'psra_trial_paper_marks',
  'upkk_trial_grade_settings', 'upkk_trial_paper_marks', 'khalifah_muda_components',
  'khalifah_muda_records', 'sahsiah_ihab_assessments', 'student_enrollments',
  'student_transfer_logs', 'subject_component_mark_settings', 'school_subject_mark_settings',
  'school_subject_component_mark_settings',
  'subject_grade_rules', 'system_settings',
];

if (!url || !key) {
  console.error('Tetapkan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sebelum export.');
  process.exit(1);
}

async function readTable(table) {
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const response = await fetch(`${url}/rest/v1/${table}?select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${offset}-${offset + pageSize - 1}` },
    });
    if (!response.ok) throw new Error(`${table}: HTTP ${response.status} ${await response.text()}`);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error(`${table}: response bukan array`);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

const result = {};
for (const table of tables) {
  process.stdout.write(`Export ${table}... `);
  result[table] = await readTable(table);
  console.log(`${result[table].length} rekod`);
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(`Export selesai: ${output}`);
