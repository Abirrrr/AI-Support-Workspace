param([Parameter(Mandatory=$true)][string]$Name, [Parameter(Mandatory=$true)][string]$Command)
$auditLogRoot = Join-Path $PSScriptRoot 'results/resume-command-evidence'
New-Item -ItemType Directory -Force -Path $auditLogRoot | Out-Null
$auditLogPath = Join-Path $auditLogRoot ($Name + '.txt')
if (Test-Path -LiteralPath $auditLogPath) { throw "Refusing to overwrite $auditLogPath" }
$auditStarted = [DateTime]::UtcNow
$auditWatch = [Diagnostics.Stopwatch]::StartNew()
"Command: $Command`nStarted UTC: $($auditStarted.ToString('o'))" | Set-Content -Encoding utf8 -LiteralPath $auditLogPath
Invoke-Expression $Command 2>&1 | ForEach-Object {
  $auditLine = $_.ToString()
  Add-Content -Encoding utf8 -LiteralPath $auditLogPath -Value $auditLine
  Write-Output $auditLine
}
$auditExit = $LASTEXITCODE
$auditWatch.Stop()
$auditResult = [ordered]@{command=$Command; startedUtc=$auditStarted.ToString('o'); finishedUtc=[DateTime]::UtcNow.ToString('o'); elapsedSeconds=$auditWatch.Elapsed.TotalSeconds; exitCode=$auditExit}
$auditResult | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $auditLogRoot ($Name + '.json'))
$auditResult | ConvertTo-Json
exit $auditExit
