param([Parameter(Mandatory=$true)][string]$SupabaseCli)
$ErrorActionPreference = 'Stop'
$projectRef = 'midxwtzhytzvbmidpvsl'
Add-Type -AssemblyName System.Security
function Read-Database([string]$Sql) {
  $ErrorActionPreference = 'Continue'
  $raw = & $SupabaseCli db query --linked --project-ref $projectRef --output json $Sql 2>$null
  $ErrorActionPreference = 'Stop'
  if ($LASTEXITCODE -ne 0) { throw 'Database snapshot query failed; no data printed.' }
  return (($raw -join "`n") | ConvertFrom-Json).rows
}
$tables = Read-Database "select schemaname,tablename from pg_tables where schemaname in ('public','auth','storage','supabase_migrations') order by schemaname,tablename"
$parts = @()
foreach ($table in $tables) {
  if ($table.schemaname -notmatch '^[a-z_]+$' -or $table.tablename -notmatch '^[a-z0-9_]+$') { throw 'Unexpected table identifier' }
  $qualified = '"' + $table.schemaname + '"."' + $table.tablename + '"'
  $parts += "select '$($table.schemaname).$($table.tablename)' as name, coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) as data from $qualified t"
}
$sql = @"
select jsonb_build_object(
 'project', '$projectRef', 'captured_at', now(), 'server_version', version(),
 'tables', (select jsonb_object_agg(name,data) from ($($parts -join ' union all ')) snapshot),
 'functions', (select coalesce(jsonb_agg(jsonb_build_object('name',p.oid::regprocedure::text,'definition',pg_get_functiondef(p.oid),'acl',p.proacl)), '[]'::jsonb) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f'),
 'columns', (select jsonb_agg(to_jsonb(c)) from information_schema.columns c where table_schema='public'),
 'constraints', (select jsonb_agg(jsonb_build_object('table',c.conrelid::regclass::text,'name',c.conname,'definition',pg_get_constraintdef(c.oid))) from pg_constraint c join pg_namespace n on n.oid=c.connamespace where n.nspname='public'),
 'indexes', (select jsonb_agg(to_jsonb(i)) from pg_indexes i where schemaname='public'),
 'policies', (select jsonb_agg(to_jsonb(p)) from pg_policies p where schemaname='public'),
 'triggers', (select jsonb_agg(pg_get_triggerdef(t.oid)) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal),
 'grants', (select jsonb_agg(to_jsonb(g)) from information_schema.role_table_grants g where table_schema='public')
) as snapshot;
"@
$row = Read-Database $sql
$json = $row[0].snapshot | ConvertTo-Json -Depth 100 -Compress
$bytes = [Text.Encoding]::UTF8.GetBytes($json)
$encrypted = [Security.Cryptography.ProtectedData]::Protect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$folder = Join-Path (Get-Location).Path 'artifacts/club-production'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
$file = Join-Path $folder ("before-club-$stamp.dpapi")
[IO.File]::WriteAllBytes($file,$encrypted)
$restored = [Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($file),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
$sha = [Security.Cryptography.SHA256]::Create()
$hash = [Convert]::ToBase64String($sha.ComputeHash($bytes))
if ($hash -ne [Convert]::ToBase64String($sha.ComputeHash($restored))) { throw 'Encrypted snapshot verification failed' }
$verified = [Text.Encoding]::UTF8.GetString($restored) | ConvertFrom-Json
$counts = [ordered]@{}
foreach ($property in $verified.tables.PSObject.Properties) { $counts[$property.Name] = @($property.Value).Count }
$manifest = [ordered]@{project=$projectRef;capturedAt=$verified.captured_at;encryptedFile=[IO.Path]::GetFileName($file);sha256Base64=$hash;verified=$true;format='Logical JSON snapshot with migration history and public catalog definitions; Windows CurrentUser DPAPI';counts=$counts}
$manifest | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 (Join-Path $folder 'backup-manifest.json')
Write-Output "Encrypted production snapshot verified: $($counts.Count) tables. No account data printed."
