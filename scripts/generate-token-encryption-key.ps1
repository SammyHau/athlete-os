[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$bytes = New-Object byte[] 32
$generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try {
  $generator.GetBytes($bytes)
  [Convert]::ToBase64String($bytes)
}
finally {
  $generator.Dispose()
  [Array]::Clear($bytes, 0, $bytes.Length)
}
