[CmdletBinding()]
param(
    [switch]$RemoveArtifacts
)

. (Join-Path $PSScriptRoot 'DevelopmentHost.Common.ps1')

Assert-WindowsDevelopmentHostEnvironment
if (Test-Path -LiteralPath $script:DevelopmentRegistryPath) {
    Remove-Item -LiteralPath $script:DevelopmentRegistryPath -Force
    Write-Output "Removed development HKCU registration: $($script:DevelopmentHostName)"
}
else {
    Write-Output 'Development HKCU registration was already absent.'
}

if ($RemoveArtifacts) {
    $resolvedArtifactRoot = [IO.Path]::GetFullPath($script:ArtifactRoot)
    $resolvedCompanionRoot = [IO.Path]::GetFullPath($script:CompanionRoot)
    $requiredPrefix = $resolvedCompanionRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if (-not $resolvedArtifactRoot.StartsWith($requiredPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Refusing to remove development artifacts outside the native companion directory.'
    }
    if (Test-Path -LiteralPath $resolvedArtifactRoot) {
        Remove-Item -LiteralPath $resolvedArtifactRoot -Recurse -Force
        Write-Output "Removed project-owned development artifacts: $resolvedArtifactRoot"
    }
}

if (Test-Path -LiteralPath $script:DevelopmentRegistryPath) {
    throw 'Development HKCU registration still exists after unregister.'
}
Write-Output 'Development unregister verification: PASS'
