param(
  [string]$OutputDirectory = '.backups'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backupRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot $OutputDirectory))
$allowedRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot '.backups'))

if (-not $backupRoot.StartsWith($allowedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Lokasi backup mesti berada di dalam folder .backups projek.'
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue) -and -not (Get-Command podman -ErrorAction SilentlyContinue)) {
  throw 'Supabase CLI memerlukan Docker Desktop atau Podman untuk db dump. Pasang salah satu dahulu.'
}

New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$schemaFile = Join-Path $backupRoot "emumtaz-$stamp-schema.sql"
$dataFile = Join-Path $backupRoot "emumtaz-$stamp-data.sql"

Push-Location $projectRoot
try {
  & npx supabase db dump --linked --file $schemaFile
  if ($LASTEXITCODE -ne 0) { throw 'Backup schema gagal.' }
  & npx supabase db dump --linked --data-only --use-copy --file $dataFile
  if ($LASTEXITCODE -ne 0) { throw 'Backup data gagal.' }
} catch {
  Remove-Item -LiteralPath $schemaFile, $dataFile -Force -ErrorAction SilentlyContinue
  throw
} finally {
  Pop-Location
}

Get-Item -LiteralPath $schemaFile, $dataFile | Select-Object FullName, Length, LastWriteTime
