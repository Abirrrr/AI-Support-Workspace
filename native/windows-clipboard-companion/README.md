# Windows Clipboard Companion Foundation

This directory contains the M14-I.3/M14-I.3.1 Windows native-host foundation and M14-I.4/M14-I.4.1 development integration governed by Decision 43. It is a focused C#/.NET 10 `win-x64` infrastructure adapter. Development tooling publishes it for one stable extension origin, generates a machine-local Native Messaging manifest, and registers only the `.dev` host under HKCU. Settings readiness and end-to-end Image clipboard preparation/visible native paste passed in real Chrome before M14-I.5 cleanup. It includes no production installer, production registration, signing, automatic paste, network request, or temporary image-file path.

## Process contract

The executable is intended only for Chrome's future one-shot `runtime.sendNativeMessage()` launch shape:

```text
process start
-> exact invocation/origin validation
-> read exactly one bounded Native Messaging frame
-> process without reading ahead or waiting for stdin EOF
-> at most one framed response
-> process exit
```

The declared frame length is the request boundary for the one-shot process. Bytes after that frame are not inspected: one `sendNativeMessage()` launch consumes one request, responds, and exits. Prefix and declared-body truncation still fail closed, and the 7,000,000-byte request limit is enforced before body allocation.

Protocol v1 supports only `get-capabilities` and `write-image-png`. Standard output is reserved for length-prefixed protocol JSON. Production diagnostics are off. The image path accepts only a canonical-base64 PNG of at most 5,242,880 decoded bytes, repeats Decision 42's PNG dimension/pixel/raster limits, decodes with WIC on the dedicated STA request thread, and requires registered `PNG` plus `CF_DIBV5` clipboard writes through a companion-owned non-NULL HWND.

## Caller identity

The expected caller origin is immutable assembly metadata supplied at build/publish time through `ExpectedExtensionOrigin`. The default M14-I.3 build deliberately embeds an empty value and therefore rejects every caller. It never treats an empty value or wildcard as permissive. Tests inject only this deterministic test origin:

```text
chrome-extension://abcdefghijklmnopabcdefghijklmnop/
```

The committed public development identity is `cekfepejbcgdgeiedpfnlinchfeihknl`, derived from the manifest public key in `config/native-clipboard-companion.development.json`. Its only trusted origin is `chrome-extension://cekfepejbcgdgeiedpfnlinchfeihknl/`; no private key is stored. The normal extension build does not use this development identity, and no production identity is assumed.

## Validation

```powershell
dotnet restore AI.SupportWorkspace.ClipboardCompanion.sln
dotnet build AI.SupportWorkspace.ClipboardCompanion.sln -c Release --no-restore
dotnet test AI.SupportWorkspace.ClipboardCompanion.sln -c Release --no-build
dotnet publish src/AI.SupportWorkspace.ClipboardCompanion/AI.SupportWorkspace.ClipboardCompanion.csproj -c Release -r win-x64 --self-contained true
```

The standard suite uses mocked clipboard calls and never mutates the developer's real clipboard. WIC and companion-window tests exercise Windows-native decode/window foundations without opening or emptying the clipboard. Build products under `bin/` and `obj/` are ignored and must not be committed.

Build the stable native-development Chrome extension from the repository root:

```powershell
pnpm build:native-dev
```

Register, verify, and unregister the development companion from the repository root:

```powershell
& native/windows-clipboard-companion/scripts/Register-DevelopmentHost.ps1
& native/windows-clipboard-companion/scripts/Test-DevelopmentHostRegistration.ps1
& native/windows-clipboard-companion/scripts/Unregister-DevelopmentHost.ps1
```

Registration publishes only the expected project to the ignored `artifacts/development-host/publish` directory, embeds the exact development origin, verifies a non-mutating framed `get-capabilities` exchange, generates an ignored absolute-path host manifest, and writes only `HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.ai_support_workspace.clipboard.dev`. Unregister is idempotent; pass `-RemoveArtifacts` to remove only this project-owned generated development directory.

If registered PNG transfer succeeds but the required CF_DIBV5 transfer fails, the operation remains a failure and is never retried. While the clipboard is still open, the host attempts one best-effort clear, then attempts `CloseClipboard`. A successfully transferred HGLOBAL is never directly freed by the host; only memory that never transferred remains application-owned and is released by the application.

Small language-neutral golden fixtures live in `fixtures/protocol-v1/` and are consumed by both the native tests and M14-I.4 TypeScript conformance tests.

M14-I.5 leaves this native source and protocol unchanged. It removes the failed browser Image/File transports and feasibility probes from the extension while preserving the Text offscreen transport. The post-cleanup Principal smoke test reloads the `native-dev` build, confirms Settings `Ready`, activates one existing Image Snippet, confirms cleanup and `Image copied — press Ctrl+V`, and verifies a visible image through native `Ctrl+V`.
