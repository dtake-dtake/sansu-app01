$ErrorActionPreference = "Stop"

# Project root and config autodetect
$Root   = $PSScriptRoot
$Config = Join-Path $PSScriptRoot "updates_list.tsv"

Write-Host "=== MULTI UPDATE START ==="
Write-Host ("ROOT  : {0}" -f $Root)
Write-Host ("CONFIG: {0}" -f $Config)

# python check
$py = "python"
try { & $py --version | Out-Null } catch {
  Write-Error "Python not found. Install Python or use 'py -3' instead."
  exit 1
}

$updateScript = Join-Path $Root "update_app_data.py"
if (!(Test-Path -LiteralPath $updateScript)) { Write-Error "update_app_data.py not found."; exit 1 }
if (!(Test-Path -LiteralPath $Config))      { Write-Error "updates_list.tsv not found.";   exit 1 }

# Read config (UTF-8 with/without BOM ok)
$lines = Get-Content -LiteralPath $Config -Encoding UTF8

$lineNo = 0
foreach ($line in $lines) {
  $lineNo++
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  if ($line.TrimStart().StartsWith("#"))   { continue }

  # split by TAB or comma
  $parts = $line -split "`,\s*|`t"
  if ($parts.Count -lt 3) {
    Write-Warning ("Line {0}: cannot parse -> {1}" -f $lineNo, $line)
    continue
  }

  $grade = $parts[0].Trim()
  $unit  = $parts[1].Trim()
  $dir   = $parts[2].Trim()

  Write-Host ""
  Write-Host "--- UPDATING ---"
  Write-Host (" grade: {0}" -f $grade)
  Write-Host (" unit : {0}" -f $unit)
  Write-Host (" dir  : {0}" -f $dir)

  try {
    & $py $updateScript --root $Root --grade $grade --unit $unit --dir $dir
  } catch {
    Write-Warning ("Line {0}: error -> {1}" -f $lineNo, $_.Exception.Message)
  }
}

Write-Host ""
Write-Host "=== MULTI UPDATE DONE ==="
