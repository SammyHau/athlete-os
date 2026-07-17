[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$backendEnv = Join-Path $projectRoot "backend\.env"
$mobileEnv = Join-Path $projectRoot ".env"

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  throw "npm.cmd wurde nicht gefunden. Installiere Node.js und öffne danach ein neues Terminal."
}
if (-not (Test-Path -LiteralPath $backendEnv)) {
  throw "backend/.env fehlt. Führe zuerst scripts/prepare-strava-local.ps1 aus und richte die Datei ein."
}
if (-not (Test-Path -LiteralPath $mobileEnv)) {
  throw ".env für die Mobile-App fehlt. Führe zuerst scripts/prepare-strava-local.ps1 aus und richte die Datei ein."
}

$powerShell = (Get-Command powershell.exe -ErrorAction Stop).Source
$escapedRoot = $projectRoot.Replace("'", "''")
$backendCommand = "Set-Location -LiteralPath '$escapedRoot'; `$Host.UI.RawUI.WindowTitle = 'AthleteOS Backend'; npm.cmd run backend"
$expoCommand = "Set-Location -LiteralPath '$escapedRoot'; `$Host.UI.RawUI.WindowTitle = 'AthleteOS Expo'; npm.cmd start -- --lan"

try {
  Start-Process -FilePath $powerShell -WindowStyle Normal -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $backendCommand
  ) | Out-Null
  Start-Sleep -Milliseconds 800
  Start-Process -FilePath $powerShell -WindowStyle Normal -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $expoCommand
  ) | Out-Null
} catch {
  throw "Backend und Expo konnten nicht gestartet werden: $($_.Exception.Message)"
}

Write-Host "Backend und Expo wurden in zwei PowerShell-Fenstern gestartet." -ForegroundColor Green
Write-Host "Scanne den Expo-QR-Code mit Expo Go, sobald Metro bereit ist."
