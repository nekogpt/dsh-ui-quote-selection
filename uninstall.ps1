param(
  [string]$Pkg = "dsh-ui-quote-selection",
  [switch]$RemovePackage,
  [switch]$Restart
)
$ErrorActionPreference = "Stop"
if (-not $env:DSH_HOME) { throw "DSH_HOME is not set (run this inside a dsh environment)" }
$profile = Join-Path $env:DSH_HOME "profiles\web"
if (-not (Test-Path $profile)) { throw "web profile not found: $profile" }

# 1. remove the patch row (idempotent)
$patch = Join-Path $profile "cordis.patch.yml"
$utf8 = [System.Text.UTF8Encoding]::new($false)
$text = [System.IO.File]::ReadAllText($patch, $utf8)
if ($text -match "id: ui-quote-selection") {
  $block = @'
- insert:
    # Selection to quote-to-composer client plugin (dsh.client row).
    - id: ui-quote-selection
      name: 'dsh-ui-quote-selection'
'@
  $text = $text.Replace($block, "")
  $text = $text.Trim()
  if ($text -eq "") { $text = "[]" }
  [System.IO.File]::WriteAllText($patch, $text + [char]10, $utf8)
  Write-Host "patch row removed"
} else {
  Write-Host "patch row not present"
}

# 2. remove the package (optional)
if ($RemovePackage) {
  $dest = Join-Path $profile ("node_modules\" + $Pkg)
  if (Test-Path $dest) { Remove-Item $dest -Recurse -Force; Write-Host "package dir removed" }
  if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    Push-Location $profile
    try { & pnpm remove $Pkg *> $null } finally { Pop-Location }
  }
}

# 3. restart or instructions
if ($Restart) {
  $procs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match "dsh" -and $_.CommandLine -match "web" }
  $replay = @($procs | ForEach-Object { $_.CommandLine })
  foreach ($p in $procs) { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Seconds 2
  foreach ($cmd in $replay) {
    try {
      $clean = $cmd.Trim().Trim('"')
      $space = $clean.IndexOf(" ")
      if ($space -gt 0) { Start-Process -FilePath $clean.Substring(0, $space) -ArgumentList $clean.Substring($space + 1) -WindowStyle Hidden }
      else { Start-Process -FilePath $clean -WindowStyle Hidden }
      Write-Host "restarted: $clean"
    } catch { Write-Host "restart failed — restart dsh web manually" }
  }
} else {
  Write-Host ""
  Write-Host "done. restart dsh web and hard-refresh the browser."
}
