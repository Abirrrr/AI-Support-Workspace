Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:DevelopmentHostName = 'com.ai_support_workspace.clipboard.dev'
$script:ProductionHostName = 'com.ai_support_workspace.clipboard'
$script:ScriptDirectory = Split-Path -Parent $PSCommandPath
$script:CompanionRoot = [IO.Path]::GetFullPath((Join-Path $script:ScriptDirectory '..'))
$script:RepositoryRoot = [IO.Path]::GetFullPath((Join-Path $script:ScriptDirectory '..\..\..'))
$script:DevelopmentConfigPath = Join-Path $script:RepositoryRoot 'config\native-clipboard-companion.development.json'
$script:ProjectPath = Join-Path $script:CompanionRoot 'src\AI.SupportWorkspace.ClipboardCompanion\AI.SupportWorkspace.ClipboardCompanion.csproj'
$script:ArtifactRoot = Join-Path $script:CompanionRoot 'artifacts\development-host'
$script:PublishDirectory = Join-Path $script:ArtifactRoot 'publish'
$script:ExecutablePath = Join-Path $script:PublishDirectory 'AI.SupportWorkspace.ClipboardCompanion.exe'
$script:ManifestPath = Join-Path $script:ArtifactRoot "$($script:DevelopmentHostName).json"
$script:DevelopmentRegistryPath = "Registry::HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\$($script:DevelopmentHostName)"
$script:ProductionRegistryPath = "Registry::HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\$($script:ProductionHostName)"

function Assert-WindowsDevelopmentHostEnvironment {
    if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT) {
        throw 'The development clipboard companion can be registered only on Windows.'
    }
}

function Get-DevelopmentHostConfiguration {
    if (-not (Test-Path -LiteralPath $script:DevelopmentConfigPath -PathType Leaf)) {
        throw "Development identity configuration is missing: $($script:DevelopmentConfigPath)"
    }

    $configuration = Get-Content -Raw -LiteralPath $script:DevelopmentConfigPath | ConvertFrom-Json
    $propertyNames = @($configuration.PSObject.Properties.Name | Sort-Object)
    $expectedNames = @('extensionId', 'extensionOrigin', 'hostName', 'manifestKey' | Sort-Object)
    if (($propertyNames -join ',') -ne ($expectedNames -join ',')) {
        throw 'Development identity configuration has an unexpected shape.'
    }
    if ($configuration.hostName -ne $script:DevelopmentHostName) {
        throw 'Development host name does not match the approved .dev identity.'
    }

    try {
        $publicKey = [Convert]::FromBase64String($configuration.manifestKey)
    }
    catch {
        throw 'Development manifest public key is not valid base64.'
    }
    $sha256 = [Security.Cryptography.SHA256]::Create()
    try {
        $digest = $sha256.ComputeHash($publicKey)
    }
    finally {
        $sha256.Dispose()
    }
    $alphabet = 'abcdefghijklmnop'
    $derivedId = [Text.StringBuilder]::new(32)
    for ($index = 0; $index -lt 16; $index += 1) {
        [void]$derivedId.Append($alphabet[[int]($digest[$index] -shr 4)])
        [void]$derivedId.Append($alphabet[[int]($digest[$index] -band 15)])
    }
    $derivedExtensionId = $derivedId.ToString()
    $derivedOrigin = "chrome-extension://$derivedExtensionId/"
    if ($configuration.extensionId -ne $derivedExtensionId -or $configuration.extensionOrigin -ne $derivedOrigin) {
        throw 'Development manifest key, extension ID, and extension origin do not match.'
    }

    return $configuration
}

function Assert-DotNet10Sdk {
    $version = (& dotnet --version).Trim()
    if ($LASTEXITCODE -ne 0 -or $version -notmatch '^10\.') {
        throw 'The .NET 10 SDK is required to publish the development clipboard companion.'
    }
}

function Publish-DevelopmentHost {
    param(
        [Parameter(Mandatory)]
        [string]$ExpectedOrigin
    )

    New-Item -ItemType Directory -Force -Path $script:PublishDirectory | Out-Null
    & dotnet publish $script:ProjectPath -c Release -r win-x64 --self-contained true "/p:ExpectedExtensionOrigin=$ExpectedOrigin" -o $script:PublishDirectory
    if ($LASTEXITCODE -ne 0) {
        throw 'Development companion publish failed.'
    }
    if (-not (Test-Path -LiteralPath $script:ExecutablePath -PathType Leaf)) {
        throw "Published development executable is missing: $($script:ExecutablePath)"
    }
}

function Invoke-DevelopmentHostCapabilities {
    param(
        [Parameter(Mandatory)]
        [string]$ExpectedOrigin
    )

    $requestId = '0123456789abcdef0123456789abcdef'
    $requestJson = "{`"protocolVersion`":1,`"requestId`":`"$requestId`",`"operation`":`"get-capabilities`"}"
    $body = [Text.Encoding]::UTF8.GetBytes($requestJson)
    $prefix = [BitConverter]::GetBytes([uint32]$body.Length)

    $startInfo = [Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $script:ExecutablePath
    $startInfo.Arguments = "$ExpectedOrigin --parent-window=0"
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardInput = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $startInfo
    try {
        if (-not $process.Start()) {
            throw 'Development companion could not be started.'
        }
        $process.StandardInput.BaseStream.Write($prefix, 0, $prefix.Length)
        $process.StandardInput.BaseStream.Write($body, 0, $body.Length)
        $process.StandardInput.BaseStream.Flush()
        $process.StandardInput.Close()

        $output = [IO.MemoryStream]::new()
        try {
            $process.StandardOutput.BaseStream.CopyTo($output)
            if (-not $process.WaitForExit(10000)) {
                $process.Kill()
                throw 'Development companion capability check timed out.'
            }
            if ($process.ExitCode -ne 0) {
                throw "Development companion rejected its configured origin (exit $($process.ExitCode))."
            }
            $framed = $output.ToArray()
        }
        finally {
            $output.Dispose()
        }
    }
    finally {
        $process.Dispose()
    }

    if ($framed.Length -lt 5) {
        throw 'Development companion returned a truncated capability frame.'
    }
    $responseLength = [BitConverter]::ToUInt32($framed, 0)
    if ($responseLength -ne ($framed.Length - 4)) {
        throw 'Development companion returned an inexact capability frame.'
    }
    $responseJson = [Text.Encoding]::UTF8.GetString($framed, 4, [int]$responseLength)
    $response = $responseJson | ConvertFrom-Json
    if (
        $response.protocolVersion -ne 1 -or
        $response.requestId -ne $requestId -or
        $response.status -ne 'success' -or
        $response.result.operation -ne 'get-capabilities' -or
        @($response.result.supportedProtocolVersions).Count -ne 1 -or
        $response.result.supportedProtocolVersions[0] -ne 1 -or
        @($response.result.supportedOperations).Count -ne 1 -or
        $response.result.supportedOperations[0] -ne 'write-image-png'
    ) {
        throw 'Development companion capability response is incompatible.'
    }
}

function Write-DevelopmentHostManifest {
    param(
        [Parameter(Mandatory)]
        [string]$ExpectedOrigin
    )

    New-Item -ItemType Directory -Force -Path $script:ArtifactRoot | Out-Null
    $manifest = [ordered]@{
        name = $script:DevelopmentHostName
        description = 'AI Support Workspace development Windows clipboard companion'
        path = [IO.Path]::GetFullPath($script:ExecutablePath)
        type = 'stdio'
        allowed_origins = @($ExpectedOrigin)
    }
    $json = $manifest | ConvertTo-Json -Depth 4
    [IO.File]::WriteAllText(
        $script:ManifestPath,
        $json,
        [Text.UTF8Encoding]::new($false)
    )
}

function Assert-DevelopmentHostManifest {
    param(
        [Parameter(Mandatory)]
        [string]$ExpectedOrigin
    )

    if (-not (Test-Path -LiteralPath $script:ManifestPath -PathType Leaf)) {
        throw "Development host manifest is missing: $($script:ManifestPath)"
    }
    $manifest = Get-Content -Raw -LiteralPath $script:ManifestPath | ConvertFrom-Json
    $propertyNames = @($manifest.PSObject.Properties.Name | Sort-Object)
    $expectedNames = @('allowed_origins', 'description', 'name', 'path', 'type' | Sort-Object)
    if (($propertyNames -join ',') -ne ($expectedNames -join ',')) {
        throw 'Development host manifest has an unexpected shape.'
    }
    if (
        $manifest.name -ne $script:DevelopmentHostName -or
        $manifest.type -ne 'stdio' -or
        $manifest.path -ne [IO.Path]::GetFullPath($script:ExecutablePath) -or
        -not (Test-Path -LiteralPath $manifest.path -PathType Leaf) -or
        @($manifest.allowed_origins).Count -ne 1 -or
        $manifest.allowed_origins[0] -ne $ExpectedOrigin
    ) {
        throw 'Development host manifest does not match the approved identity and executable.'
    }
}

function Assert-DevelopmentHostRegistration {
    param(
        [Parameter(Mandatory)]
        [string]$ExpectedOrigin
    )

    Assert-DevelopmentHostManifest -ExpectedOrigin $ExpectedOrigin
    if (-not (Test-Path -LiteralPath $script:DevelopmentRegistryPath)) {
        throw 'Development Native Messaging HKCU registration is missing.'
    }
    $registeredManifest = (Get-Item -LiteralPath $script:DevelopmentRegistryPath).GetValue('')
    if ($registeredManifest -ne [IO.Path]::GetFullPath($script:ManifestPath)) {
        throw 'Development Native Messaging registry value does not point to the generated manifest.'
    }
    Invoke-DevelopmentHostCapabilities -ExpectedOrigin $ExpectedOrigin
}
