[CmdletBinding()]
param()

. (Join-Path $PSScriptRoot 'DevelopmentHost.Common.ps1')

Assert-WindowsDevelopmentHostEnvironment
$configuration = Get-DevelopmentHostConfiguration
Assert-DevelopmentHostRegistration -ExpectedOrigin $configuration.extensionOrigin

Write-Output "Development extension ID: $($configuration.extensionId)"
Write-Output "Development host name: $($script:DevelopmentHostName)"
Write-Output 'Registry scope: HKCU'
Write-Output "Host manifest: $([IO.Path]::GetFullPath($script:ManifestPath))"
Write-Output "Host executable: $([IO.Path]::GetFullPath($script:ExecutablePath))"
Write-Output 'Registration verification: PASS'
