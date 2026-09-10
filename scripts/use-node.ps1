$ErrorActionPreference = "Stop"

$nvm = "$env:LOCALAPPDATA\nvm\nvm.exe"
$env:NVM_HOME = "$env:LOCALAPPDATA\nvm"
$env:NVM_SYMLINK = "C:\nvm4w\nodejs"
if (-not (Test-Path $nvm)) {
  Write-Error "nvm-windows no encontrado en '$nvm'. Instalalo y volvé a intentar."
}

& $nvm use 22 | Out-Host
if ($LASTEXITCODE -ne 0) { throw 'No se pudo activar Node 22. Instala una versión 22.x con nvm-windows.' }

$nodePath = $env:NVM_SYMLINK

$machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$env:Path = "$env:NVM_HOME;$nodePath;$machinePath;$userPath"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "No se encontró 'node' en PATH luego de ejecutar nvm use 22."
}

Write-Host "✅ Node activo en esta terminal:" -ForegroundColor Green
node --version
npm --version
