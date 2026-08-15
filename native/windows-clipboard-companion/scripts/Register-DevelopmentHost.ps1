[CmdletBinding()]
param()

. (Join-Path $PSScriptRoot 'DevelopmentHost.Common.ps1')

Assert-WindowsDevelopmentHostEnvironment
Assert-DotNet10Sdk
$configuration = Get-DevelopmentHostConfiguration
$productionRegistrationExisted = Test-Path -LiteralPath $script:ProductionRegistryPath

Publish-DevelopmentHost -ExpectedOrigin $configuration.extensionOrigin
Invoke-DevelopmentHostCapabilities -ExpectedOrigin $configuration.extensionOrigin
Write-DevelopmentHostManifest -ExpectedOrigin $configuration.extensionOrigin
Assert-DevelopmentHostManifest -ExpectedOrigin $configuration.extensionOrigin

New-Item -Path $script:DevelopmentRegistryPath -Force | Out-Null
Set-Item -LiteralPath $script:DevelopmentRegistryPath -Value ([IO.Path]::GetFullPath($script:ManifestPath))

Assert-DevelopmentHostRegistration -ExpectedOrigin $configuration.extensionOrigin
if ((Test-Path -LiteralPath $script:ProductionRegistryPath) -ne $productionRegistrationExisted) {
    throw 'Production Native Messaging registration changed unexpectedly.'
}

Write-Output "Development extension ID: $($configuration.extensionId)"
Write-Output "Development extension origin: $($configuration.extensionOrigin)"
Write-Output "Development host name: $($script:DevelopmentHostName)"
Write-Output 'Registry scope: HKCU'
Write-Output "Host manifest: $([IO.Path]::GetFullPath($script:ManifestPath))"
Write-Output "Host executable: $([IO.Path]::GetFullPath($script:ExecutablePath))"
Write-Output 'Registration verification: PASS'
