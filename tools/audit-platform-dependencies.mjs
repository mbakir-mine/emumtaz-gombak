import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const roots = ['app', 'lib', 'middleware.ts', 'next.config.ts', 'next.config.mjs'];
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const needles = [
  { name: 'Supabase package/import', pattern: /@supabase\/supabase-js|supabase-server|from ['"]@\/lib\/supabase|from ['"].*supabase['"]/i },
  { name: 'Supabase environment', pattern: /NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY/i },
  { name: 'Vercel environment/runtime', pattern: /VERCEL_URL|VERCEL_ENV|NEXT_PUBLIC_VERCEL|@vercel\//i },
];

async function filesAt(path) {
  const full = join(root, path);
  try { if ((await stat(full)).isFile()) return [full]; } catch { return []; }
  const result = [];
  for (const entry of await readdir(full, { withFileTypes: true })) {
    const child = join(full, entry.name);
    if (entry.isDirectory() && !['node_modules', '.next'].includes(entry.name)) result.push(...await filesAt(relative(root, child)));
    else if (entry.isFile() && extensions.has(entry.name.slice(entry.name.lastIndexOf('.')))) result.push(child);
  }
  return result;
}

const files = (await Promise.all(roots.map(filesAt))).flat();
const findings = [];
for (const file of files) {
  const content = await readFile(file, 'utf8');
  for (const needle of needles) if (needle.pattern.test(content)) findings.push({ file: relative(root, file).replaceAll('\\', '/'), dependency: needle.name });
}
console.log(JSON.stringify({ scannedFiles: files.length, affectedFiles: new Set(findings.map((item) => item.file)).size, findings, cutoverReady: findings.length === 0 }, null, 2));
