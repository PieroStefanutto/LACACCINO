param([Parameter(Mandatory=$true)][string]$SupabaseCli)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$folder = Join-Path (Get-Location).Path 'artifacts/club-production'
$manifest = Get-Content -Raw -Encoding UTF8 (Join-Path $folder 'backup-manifest.json') | ConvertFrom-Json
if ($manifest.project -ne 'midxwtzhytzvbmidpvsl') { throw 'Unexpected project' }
$bytes = [Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes((Join-Path $folder $manifest.encryptedFile)),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
$snapshot = [Text.Encoding]::UTF8.GetString($bytes) | ConvertFrom-Json
$checked = 0
foreach ($table in $snapshot.tables.PSObject.Properties | Where-Object { $_.Name.StartsWith('public.') }) {
  $name = $table.Name.Split('.')[1]
  if ($name -notmatch '^[a-z_]+$') { throw 'Unexpected table' }
  $columns = @($snapshot.columns | Where-Object {$_.table_name -eq $name} | ForEach-Object {'"' + $_.column_name + '"'}) -join ','
  $sql = "select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) as data from (select $columns from public.$name) t"
  $ErrorActionPreference = 'Continue'
  $raw = & $SupabaseCli db query --linked --project-ref $manifest.project --output json $sql 2>$null
  $ErrorActionPreference = 'Stop'
  if ($LASTEXITCODE -ne 0) { throw 'Verification query failed' }
  $actual = (($raw -join "`n") | ConvertFrom-Json).rows[0].data
  $before = @($table.Value | ForEach-Object { $_ | ConvertTo-Json -Depth 100 -Compress } | Sort-Object)
  $after = @($actual | ForEach-Object { $_ | ConvertTo-Json -Depth 100 -Compress } | Sort-Object)
  if (($before -join "`n") -cne ($after -join "`n")) { throw "Existing data differs in $name. No account data printed." }
  $checked++
}
Write-Output "All $checked existing public tables retain their original rows and column values."
