[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$backendEnv = Join-Path $projectRoot "backend\.env"
$mobileEnv = Join-Path $projectRoot ".env"

function Test-PrivateIPv4 {
  param([Parameter(Mandatory)][string]$Address)
  return $Address -match '^10\.' -or
    $Address -match '^192\.168\.' -or
    $Address -match '^172\.(1[6-9]|2\d|3[01])\.'
}

function Get-LocalIPv4 {
  $candidates = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() |
    Where-Object {
      $_.OperationalStatus -eq [System.Net.NetworkInformation.OperationalStatus]::Up -and
      $_.NetworkInterfaceType -ne [System.Net.NetworkInformation.NetworkInterfaceType]::Loopback -and
      $_.NetworkInterfaceType -ne [System.Net.NetworkInformation.NetworkInterfaceType]::Tunnel
    } |
    ForEach-Object {
      $properties = $_.GetIPProperties()
      $hasGateway = $properties.GatewayAddresses |
        Where-Object { $_.Address.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and $_.Address.ToString() -ne "0.0.0.0" }
      if ($hasGateway) {
        $properties.UnicastAddresses |
          Where-Object { $_.Address.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork } |
          ForEach-Object { $_.Address.ToString() }
      }
    } |
    Where-Object { Test-PrivateIPv4 $_ } |
    Select-Object -Unique

  if (-not $candidates) {
    $candidates = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) |
      Where-Object { $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and (Test-PrivateIPv4 $_.ToString()) } |
      ForEach-Object { $_.ToString() }
  }

  $address = $candidates | Select-Object -First 1
  if (-not $address) {
    throw "Keine private IPv4-Adresse gefunden. Prüfe die WLAN-Verbindung des PCs."
  }
  return $address
}

function Get-SafeEnvValue {
  param(
    [Parameter(Mandatory)][string]$Path,
    [Parameter(Mandatory)][string]$Name
  )
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  $line = Get-Content -LiteralPath $Path |
    Where-Object { $_ -match "^$([regex]::Escape($Name))=" } |
    Select-Object -Last 1
  if (-not $line) { return $null }
  return ($line -split '=', 2)[1].Trim()
}

function Test-EnvEntryPresent {
  param(
    [Parameter(Mandatory)][string]$Path,
    [Parameter(Mandatory)][string]$Name
  )
  if (-not (Test-Path -LiteralPath $Path)) { return $false }
  return [bool](Get-Content -LiteralPath $Path |
    Where-Object { $_ -match "^$([regex]::Escape($Name))=.+$" } |
    Select-Object -First 1)
}

$localIp = Get-LocalIPv4
$configuredPort = Get-SafeEnvValue -Path $backendEnv -Name "PORT"
$port = if ($configuredPort -match '^\d+$' -and [int]$configuredPort -ge 1 -and [int]$configuredPort -le 65535) {
  [int]$configuredPort
} else {
  8787
}

$backendUrl = "http://${localIp}:$port"
$callbackUrl = "$backendUrl/integrations/strava/oauth/callback"

Write-Host ""
Write-Host "AthleteOS Strava - lokaler Smartphone-Test" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Lokale IPv4-Adresse:       $localIp"
Write-Host "Backend-URL:               $backendUrl"
Write-Host "Health-URL:                $backendUrl/health"
Write-Host "OAuth-Callback-URL:        $callbackUrl"
Write-Host "Strava Callback-Domain:    $localIp"
Write-Host ""

if (Test-Path -LiteralPath $backendEnv) {
  Write-Host "[OK] backend/.env ist vorhanden." -ForegroundColor Green
  foreach ($name in @("STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET", "STRAVA_REDIRECT_URI", "PORT")) {
    if (Test-EnvEntryPresent -Path $backendEnv -Name $name) {
      Write-Host "[OK] $name ist gesetzt." -ForegroundColor Green
    } else {
      Write-Warning "$name fehlt oder ist leer. Der Wert selbst wird aus Sicherheitsgründen nicht angezeigt."
    }
  }
  $configuredRedirect = Get-SafeEnvValue -Path $backendEnv -Name "STRAVA_REDIRECT_URI"
  if ($configuredRedirect -and $configuredRedirect -ne $callbackUrl) {
    Write-Warning "STRAVA_REDIRECT_URI stimmt nicht mit der aktuellen WLAN-Adresse überein. Erwartet: $callbackUrl"
  }
} else {
  Write-Warning "backend/.env fehlt. Verwende backend/.env.example als Vorlage."
}

if (Test-Path -LiteralPath $mobileEnv) {
  Write-Host "[OK] Mobile .env ist vorhanden." -ForegroundColor Green
  foreach ($name in @("EXPO_PUBLIC_ATHLETEOS_API_URL", "EXPO_PUBLIC_INTEGRATION_MODE")) {
    if (Test-EnvEntryPresent -Path $mobileEnv -Name $name) {
      Write-Host "[OK] $name ist gesetzt." -ForegroundColor Green
    } else {
      Write-Warning "$name fehlt oder ist leer."
    }
  }
  $configuredApiUrl = Get-SafeEnvValue -Path $mobileEnv -Name "EXPO_PUBLIC_ATHLETEOS_API_URL"
  if ($configuredApiUrl -and $configuredApiUrl.TrimEnd('/') -ne $backendUrl) {
    Write-Warning "EXPO_PUBLIC_ATHLETEOS_API_URL stimmt nicht mit der aktuellen WLAN-Adresse überein. Erwartet: $backendUrl"
  }
} else {
  Write-Warning "Mobile .env fehlt. Verwende .env.example als Vorlage."
}

Write-Host ""
Write-Host "Manuell einzutragen:" -ForegroundColor Yellow
Write-Host "1. Strava Callback-Domain: $localIp"
Write-Host "2. backend/.env STRAVA_REDIRECT_URI=$callbackUrl"
Write-Host "3. Mobile .env EXPO_PUBLIC_ATHLETEOS_API_URL=$backendUrl"
Write-Host "4. Mobile .env EXPO_PUBLIC_INTEGRATION_MODE=strava"
Write-Host ""
Write-Host "PC und Smartphone müssen im gleichen privaten WLAN sein. Erlaube Node.js in der Windows-Firewall nur für private Netzwerke." -ForegroundColor Yellow
Write-Host "Secret- und Token-Werte wurden nicht ausgegeben." -ForegroundColor DarkGray
