# Windows Clipboard Companion Foundation

This directory contains the Decision 43 Windows native clipboard host and Decision 45 automatic-paste extension. It is a focused C#/.NET 10 `win-x64` infrastructure adapter. Development tooling publishes it for one stable extension origin, generates a machine-local Native Messaging manifest, and registers only the `.dev` host under HKCU. Settings readiness, protocol-v1 Image clipboard preparation/visible manual paste, and M14-K protocol-v2 automatic Text/Image paste pass in real Chrome for Intercom and Crisp. The authoritative successful trace records 4/4 `SendInput`, last error 0, and a 40-byte win-x64 `INPUT`. It includes no production installer/registration/signing/updater, network request, or temporary image-file path.

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

Protocol v1 supports only `get-capabilities` and `write-image-png`. Strict protocol v2 preserves those capabilities and adds only `capture-paste-context` plus `paste-clipboard`. V2 captures content-free HWND/PID/clipboard-sequence context and can issue only one internally fixed Ctrl-down/V-down/V-up/Ctrl-up `SendInput` array after exact foreground, clipboard, modifier, and immediate-fail mutex checks. Its win-x64 interop mirrors the complete Windows `INPUT` union and passes the required 40-byte `cbSize`. It never accepts arbitrary keys, retries, steals focus, clears the clipboard, or elevates. Standard output is reserved for length-prefixed protocol JSON and production diagnostics are off.

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

The standard suite uses mocked clipboard and fake input-platform calls and never mutates the developer's real clipboard or injects keyboard input. WIC and companion-window tests exercise Windows-native decode/window foundations without opening or emptying the clipboard. Build products under `bin/` and `obj/` are ignored and must not be committed.

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

Small language-neutral golden fixtures live in `fixtures/protocol-v1/` and are consumed by both the native tests and TypeScript conformance tests. Protocol-v2 exact request/response, canonical HWND, capability, safety, and input-ordering cases are covered independently in the TypeScript and C# suites.

M14-I.5 leaves this native source and protocol unchanged. It removes the failed browser Image/File transports and feasibility probes from the extension while preserving the Text offscreen transport. The post-cleanup real-Chrome smoke test passed: the reloaded `native-dev` build reported Settings `Ready`, activation removed the trigger, `Image copied — press Ctrl+V` appeared, and native `Ctrl+V` pasted a visible image. M14-I is complete at committed/pushed checkpoint `ebe915f`.

M14-K.2 extends this same host with strict protocol v2 while preserving exact v1 responses and Image clipboard behavior. A separate paste mutex, canonical fixed-width handles, context capture/revalidation, eight modifier checks, one-call event ordering, and full/zero/partial `SendInput` semantics are unit-tested through fakes. M14-K.2.3.5 additionally asserts the exact win-x64 `KEYBDINPUT`/union/`INPUT` layout and immediate last-error capture. The development publish enables a strict content-free paste-attempt diagnostic with counts, struct size, error number, validation booleans, and relative session/integrity only; production responses omit it. Refreshing the development executable and registration uses the existing one-step `Register-DevelopmentHost.ps1` workflow; no manual registry editing or second host is required.

M14-K.3 Principal-approved the one-process-per-message contract and its real-browser results. In a fresh service worker, automatic Image can require five one-shot host contacts (v1 capability, write, v2 capability, capture, paste); with in-memory capability flags warm it requires three. Automatic Text requires three cold and two warm. A content-free 20-run development capability probe measured 67.0 ms median and 76.1 ms p95 per launch. Decision 49 classifies this as a future architectural opportunity, not a correctness defect, and prohibits a persistent-host or non-PNG architecture change during closeout.

Functional local/development capability is complete separately from production distribution. Installer technology, stable production registration/location, code signing/publisher identity, updater/rollback, and version migration remain future work. They do not block Principal closeout of the current local/development product.
