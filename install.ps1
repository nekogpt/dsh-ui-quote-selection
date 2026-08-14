param(
  [string]$Source = "",                # local plugin dir; empty = pnpm install from registry/git
  [string]$Pkg = "dsh-ui-quote-selection",
  [switch]$Restart
)
$ErrorActionPreference = "Stop"
if (-not $env:DSH_HOME) { throw "DSH_HOME is not set (run this inside a dsh environment)" }
$profile = Join-Path $env:DSH_HOME "profiles\web"
if (-not (Test-Path $profile)) { throw "web profile not found: $profile" }

# 1. install the package
if ($Source) {
  if (-not (Test-Path (Join-Path $Source "package.json"))) { throw "not a plugin package dir (missing package.json): $Source" }
  $dest = Join-Path $profile ("node_modules\" + $Pkg)
  if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
  New-Item -ItemType Directory -Force $dest | Out-Null
  foreach ($item in @("package.json", "lib", "README.md", "LICENSE")) {
    $srcItem = Join-Path $Source $item
    if (Test-Path $srcItem) { Copy-Item $srcItem (Join-Path $dest $item) -Recurse -Force }
  }
  Write-Host "installed from $Source (package.json, lib, README, LICENSE)"
} else {
  if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { throw "pnpm not found on PATH" }
  Push-Location $profile
  try { & pnpm add $Pkg; if ($LASTEXITCODE -ne 0) { throw "pnpm add $Pkg failed" } } finally { Pop-Location }
}

# 2. patch row (idempotent)
$patch = Join-Path $profile "cordis.patch.yml"
if (-not (Test-Path $patch)) { throw "patch file missing: $patch" }
$utf8 = [System.Text.UTF8Encoding]::new($false)
$text = [System.IO.File]::ReadAllText($patch, $utf8)
if ($text -match "id: ui-quote-selection") {
  Write-Host "patch row already present"
} else {
  $block = @'
- insert:
    # Selection to quote-to-composer client plugin (dsh.client row).
    - id: ui-quote-selection
      name: 'dsh-ui-quote-selection'
'@
  $block = $block.Replace("dsh-ui-quote-selection", $Pkg)
  if ($text.Trim() -eq "[]") { $next = $text.Replace("[]", $block) } else { $next = $text.TrimEnd() + [char]10 + [char]10 + $block }
  [System.IO.File]::WriteAllText($patch, $next, $utf8)
  Write-Host "patch row added"
}

# 3. restart (best-effort replay of the original dsh web command line)
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
  Write-Host "done. restart dsh web (Ctrl+C, run it again) and hard-refresh the browser."
}
