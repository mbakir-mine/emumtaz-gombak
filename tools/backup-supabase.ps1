param(
  [string]$OutputDirectory = 'C:\backups\emumtaz-backups'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backupRoot = [System.IO.Path]::GetFullPath($OutputDirectory)
$allowedRoot = [System.IO.Path]::GetFullPath('C:\backups\emumtaz-backups')

if ($backupRoot -ne $allowedRoot -and -not $backupRoot.StartsWith("$allowedRoot\", [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Lokasi backup mesti berada di dalam C:\backups\emumtaz-backups.'
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue) -and -not (Get-Command podman -ErrorAction SilentlyContinue)) {
  throw 'Supabase CLI memerlukan Docker Desktop atau Podman untuk db dump. Pasang salah satu dahulu.'
}

New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$rolesFile = Join-Path $backupRoot "emumtaz-$stamp-roles.sql"
$schemaFile = Join-Path $backupRoot "emumtaz-$stamp-schema.sql"
$dataFile = Join-Path $backupRoot "emumtaz-$stamp-data.sql"

Push-Location $projectRoot
try {
  & npx supabase db dump --linked --role-only --file $rolesFile
  if ($LASTEXITCODE -ne 0) { throw 'Backup roles gagal.' }
  & npx supabase db dump --linked --file $schemaFile
  if ($LASTEXITCODE -ne 0) { throw 'Backup schema gagal.' }
  & npx supabase db dump --linked --data-only --use-copy --exclude 'storage.buckets_vectors' --exclude 'storage.vector_indexes' --file $dataFile
  if ($LASTEXITCODE -ne 0) { throw 'Backup data gagal.' }
} catch {
  Remove-Item -LiteralPath $rolesFile, $schemaFile, $dataFile -Force -ErrorAction SilentlyContinue
  throw
} finally {
  Pop-Location
}

Get-Item -LiteralPath $rolesFile, $schemaFile, $dataFile | Select-Object FullName, Length, LastWriteTime
