[CmdletBinding(SupportsShouldProcess)]
param([ValidateRange(1, 65535)][int]$Port = 5173)
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskRootPattern = [regex]::Escape($taskRoot) + '(?:[\\/]|["\s])'
$taskProcesses = @(Get-CimInstance Win32_Process | Where-Object {
  $_.Name -match '^node(?:\.exe)?$' -and
  $_.CommandLine -match $taskRootPattern -and
  $_.CommandLine -match 'vite'
})
$taskListeners = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
foreach ($taskProcess in $taskProcesses) {
  if ($taskListeners.OwningProcess -contains $taskProcess.ProcessId) {
    if ($PSCmdlet.ShouldProcess("Vite del proyecto, PID $($taskProcess.ProcessId)", 'Detener')) {
      Stop-Process -Id $taskProcess.ProcessId -ErrorAction Stop
    }
  }
}
if (-not $taskProcesses.Count) { Write-Output 'No se encontró Vite de este proyecto.' }
