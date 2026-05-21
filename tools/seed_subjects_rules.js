const { createClient } = require('@supabase/supabase-js');
const fs = require('node:fs');

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const subjects = [
  ['AKHLAK', 'Akhlak', 100, true, 1],
  ['SIRAH', 'Sirah', 100, true, 2],
  ['BAHASA_ARAB', 'Bahasa Arab', 100, true, 3],
  ['JAWI', 'Jawi', 100, true, 4],
  ['IMLAK_KHAT', 'Imlak dan Khat', 100, true, 5],
  ['TAUHID', 'Tauhid', 100, true, 6],
  ['FEKAH', 'Fekah', 100, true, 7],
  ['TAJWID', 'Tajwid', 100, true, 8],
  ['AS01', 'Akhlak & Sirah', 100, true, 9],
  ['BA02', 'Bahasa Arab', 100, true, 10],
  ['JIK03', 'Jawi, Imlak & Khat', 100, true, 11],
  ['TF04', 'Tauhid & Fekah', 100, true, 12],
  ['TJ05', 'Tajwid', 100, true, 13],
  ['TILAWAH', 'Tilawah', 100, false, 14],
  ['HAFAZAN', 'Hafazan', 100, false, 15],
].map(([kod_subjek, nama_subjek, markah_penuh, dikira_purata, susunan]) => ({
  kod_subjek,
  nama_subjek,
  markah_penuh,
  dikira_purata,
  susunan,
  status: 'AKTIF',
}));

const ruleRows = [
  [1, 'AKHLAK', true, 1], [1, 'BAHASA_ARAB', true, 2], [1, 'JAWI', true, 3],
  [1, 'TAUHID', true, 4], [1, 'FEKAH', true, 5], [1, 'TILAWAH', false, 6], [1, 'HAFAZAN', false, 7],
  [2, 'AKHLAK', true, 1], [2, 'BAHASA_ARAB', true, 2], [2, 'JAWI', true, 3],
  [2, 'TAUHID', true, 4], [2, 'FEKAH', true, 5], [2, 'TILAWAH', false, 6], [2, 'HAFAZAN', false, 7],
  [3, 'AKHLAK', true, 1], [3, 'SIRAH', true, 2], [3, 'BAHASA_ARAB', true, 3], [3, 'JAWI', true, 4],
  [3, 'IMLAK_KHAT', true, 5], [3, 'TAUHID', true, 6], [3, 'FEKAH', true, 7], [3, 'TAJWID', true, 8],
  [3, 'TILAWAH', false, 9], [3, 'HAFAZAN', false, 10],
  [4, 'AS01', true, 1], [4, 'BA02', true, 2], [4, 'JIK03', true, 3], [4, 'TF04', true, 4],
  [4, 'TJ05', true, 5], [4, 'TILAWAH', false, 6], [4, 'HAFAZAN', false, 7],
  [5, 'AS01', true, 1], [5, 'BA02', true, 2], [5, 'JIK03', true, 3], [5, 'TF04', true, 4],
  [5, 'TJ05', true, 5], [5, 'TILAWAH', false, 6], [5, 'HAFAZAN', false, 7],
  [6, 'AS01', true, 1], [6, 'BA02', true, 2], [6, 'JIK03', true, 3], [6, 'TF04', true, 4],
  [6, 'TJ05', true, 5], [6, 'TILAWAH', false, 6], [6, 'HAFAZAN', false, 7],
].map(([tahun, kod_subjek, dikira_purata, susunan]) => ({
  tahun,
  kod_subjek,
  dikira_purata,
  wajib_isi: true,
  susunan,
}));

async function detectRuleLevelColumn() {
  const tahunCheck = await supabase
    .from('subject_grade_rules')
    .select('tahun', { head: true })
    .limit(1);

  if (!tahunCheck.error) return 'tahun';

  const darjahCheck = await supabase
    .from('subject_grade_rules')
    .select('darjah', { head: true })
    .limit(1);

  if (!darjahCheck.error) return 'darjah';

  throw tahunCheck.error;
}

async function main() {
  const subjectResult = await supabase.from('subjects').upsert(subjects, {
    onConflict: 'kod_subjek',
  });
  if (subjectResult.error) throw subjectResult.error;

  const levelColumn = await detectRuleLevelColumn();
  const rowsForDatabase = ruleRows.map(({ tahun, ...row }) => ({
    ...row,
    [levelColumn]: tahun,
  }));

  const ruleResult = await supabase.from('subject_grade_rules').upsert(rowsForDatabase, {
    onConflict: `${levelColumn},kod_subjek`,
  });
  if (ruleResult.error) throw ruleResult.error;

  const subjectCount = await supabase.from('subjects').select('*', { count: 'exact', head: true });
  const ruleCount = await supabase.from('subject_grade_rules').select('*', { count: 'exact', head: true });
  console.log(JSON.stringify({
    subjects: subjectCount.count,
    subject_grade_rules: ruleCount.count,
    subject_grade_rules_level_column: levelColumn,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
