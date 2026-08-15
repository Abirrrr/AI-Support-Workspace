# M14-I.2 Windows Native Clipboard Companion Architecture

## Status

M14-I.2 defines the normative Windows-only, optional Native Clipboard Companion architecture. The decision itself was architecture/documentation only; M14-I.3 through M14-I.4.1 subsequently implemented and corrected the native foundation, Chrome development integration, registration, and Settings capability path, and M14-I.5 completed post-validation cleanup. M14-K.1 now defines a separate optional automatic-paste extension to that companion. No production installer/registration, AutoHotkey integration, keyboard injection, protocol-v2 operation, or automatic paste is implemented.

Decision 43 is the permanent decision record. Decision 42 remains authoritative before native transfer. The companion repeats the same applicable limits as defense in depth; it does not redefine them.

## M14-I Implementation Status

M14-I.3 now implements the standalone native foundation at `native/windows-clipboard-companion/` without revising Decision 43. The C#/.NET 10 `win-x64` solution contains the one-shot host, strict framing and v1 parser/serializer, fail-closed build-time caller-origin boundary, PNG validation, WIC PBGRA decode, DIBV5 construction, registered PNG and HGLOBAL ownership, companion HWND, bounded OpenClipboard retry, per-session mutex, protocol fixtures, and automated Windows tests. A self-contained non-NativeAOT publication succeeds.

The default M14-I.3 artifact deliberately has no configured caller origin and therefore accepts no caller. M14-I.4 adds a separate stable `native-dev` extension identity, optional `nativeMessaging`, service-worker `sendNativeMessage`, exact `.dev` host manifest, and reversible HKCU registration. M14-I.4.1 preserves callback-aligned native responses and truthful Settings status. Real Chrome validates Settings `Ready` and end-to-end Image trigger/native preparation/cleanup/notice/visible paste through that development integration. M14-I.5 removes the failed M14-I.1.4 browser File/offscreen Image path and feasibility probes. Production installer, signing, identity, and registration remain absent.

M14-I.3.1 corrects the framing implementation so the declared request frame is consumed and processed without waiting for EOF or inspecting later stdin, and adds explicit fault-injection coverage for failed best-effort partial clearing and close-error precedence. This is a clarification of Decision 43 implementation semantics, not a new architecture decision.

## M14-K.1 Automatic Paste Extension (Design Only)

Decision 45 selects the existing C#/.NET companion rather than AutoHotkey for a future Windows-only automatic-paste adapter. The feature is additive and opt-in. Clipboard preparation remains authoritative, `clipboard-only` is the default Settings mode, manual `Ctrl+V` remains permanently supported, and the clipboard is never cleared after an automatic attempt or success. M14-K.1 changes no host, protocol, Settings, permission, registration, or runtime behavior.

### Primary-source findings for input and focus

- [Chrome `runtime.MessageSender`](https://developer.chrome.com/docs/extensions/reference/api/runtime#type-MessageSender) supplies the sending document UUID, frame ID, and source tab when a content script messages the extension. [Chrome `tabs.Tab`](https://developer.chrome.com/docs/extensions/reference/api/tabs#type-Tab) explicitly says an active tab need not be in a focused window; [Chrome `windows.Window`](https://developer.chrome.com/docs/extensions/reference/api/windows#type-Window) separately exposes focused-window state. The service worker must therefore validate sender identity, active tab, and focused window rather than infer one from another.
- [Microsoft `GetForegroundWindow`](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getforegroundwindow), [`GetAncestor(GA_ROOT)`](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getancestor), and [`GetWindowThreadProcessId`](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowthreadprocessid) provide provider-independent foreground root-window and process evidence. A null result is unsafe. The companion must not call `SetForegroundWindow` or otherwise steal focus.
- [Microsoft `GetClipboardSequenceNumber`](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclipboardsequencenumber) changes when clipboard content changes. Capturing it only after successful Text/Image preparation and requiring the same value before input prevents an intervening clipboard write from being pasted automatically.
- [Microsoft `SendInput`](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput) inserts one supplied event array serially, returns the number of events inserted, does not reset keyboard state, and is limited by User Interface Privilege Isolation to equal- or lower-integrity targets. Windows does not report UIPI as the cause of a zero return. [`GetAsyncKeyState`](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getasynckeystate) supplies the current high-order down bit used for the pre-input modifier guard.
- AutoHotkey's official [Send documentation](https://www.autohotkey.com/docs/v2/lib/Send.htm) uses SendInput by default and retains Windows/UAC limitations. Its official [script documentation](https://www.autohotkey.com/docs/v2/Scripts.htm) shows that scripts require the AutoHotkey executable unless compiled, while compiled scripts package the interpreter and script. That extra runtime/toolchain, packaging, signing, update, diagnostic, and attack surface provides no stronger focus proof than direct C# Win32 interop.

### Layer ownership and focus contract

The content script owns one activation guard created from the existing generic editor adapter and Shadow-DOM composed focus/selection resolution. It binds the supported editor, frame document, exact trigger/range/caret state, request, and catalog epoch/revision. It becomes permanently invalid on focusout/blur, selection or caret departure, any input/content mutation other than its own exact authorized cleanup, editor disconnection, document hidden/pagehide, or navigation. Exact cleanup atomically transitions the guard to the expected collapsed cleanup caret before immediate revalidation. Focus returning later does not revive the guard.

The service worker owns `MessageSender.documentId`, `frameId`, `tab.id`, and `tab.windowId`, plus current active-tab and focused-window checks. It creates one random 32-lowercase-hex paste authorization, keeps it only in memory for the one in-flight request, consumes it once, and holds one extension-wide no-queue delivery critical section before clipboard preparation can begin. A second activation is declined before it can overwrite the clipboard. Completion or abandonment discards the authorization; worker restart, sender/document/frame mismatch, inactive tab, unfocused browser window, or stale catalog/request state declines automatic paste.

The native companion owns only the Windows foreground root `HWND`, its process ID, clipboard sequence number, immediate modifier state, one no-wait paste mutex, and the single input call. It has no DOM/editor/site/provider/browser-profile knowledge and does not identify Chrome by executable name. Multiple browser windows are distinguished by exact root `HWND`; browser profile and tab ownership remain browser-side proofs. The native check prevents input from following the user to another window/application. It cannot atomically prove which DOM editor inside the same unchanged window owns focus at the exact `SendInput` instant, so M14-K.2/M14-K.3 must stress the remaining same-window time-of-check/time-of-use race; failure to bound it safely blocks release.

The approved sequence is:

```text
clipboard preparation succeeds
→ service worker revalidates sender + active tab + focused window
→ protocol v2 captures foreground root HWND + PID + clipboard sequence
→ content script performs existing exact compare-and-swap cleanup
→ content script immediately revalidates the same editor and collapsed cleanup caret
→ service worker atomically consumes the one-use authorization
→ service worker revalidates sender + active tab + focused window again
→ native host validates exact HWND/PID/clipboard sequence and modifier state
→ one SendInput call may issue Ctrl+V
```

There is no arbitrary sleep. If future measured destination behavior requires a bounded delay, browser/editor and native evidence must be checked after the delay. Failure to capture a safe automatic context skips input but does not suppress the normal exact cleanup attempt authorized by clipboard success. Cleanup failure never issues automatic paste. The clipboard remains populated in every post-copy outcome.

### Exact protocol-v2 direction

Protocol v1 remains frozen byte-for-byte and newer hosts must continue to accept its exact `get-capabilities` and `write-image-png` shapes. M14-K.2 may add strict protocol v2 to the same one-process-per-`sendNativeMessage()` host. A v2 process still consumes exactly one declared frame, writes at most one bounded response, and exits. V2 capability discovery advertises v2 operations without changing a v1 capabilities response.

The new capture request has exactly:

```json
{"protocolVersion":2,"requestId":"<32-lowercase-hex>","operation":"capture-paste-context"}
```

Its success result has exactly `operation: "capture-paste-context"`, `foregroundRootWindowHandle` as 16 lowercase hexadecimal characters, `foregroundProcessId` as a nonzero unsigned 32-bit integer, and `clipboardSequenceNumber` as an unsigned 32-bit integer. A null/invalid foreground root fails safely.

The new paste request has exactly:

```json
{"protocolVersion":2,"requestId":"<32-lowercase-hex>","operation":"paste-clipboard","authorizationId":"<32-lowercase-hex>","expectedContext":{"foregroundRootWindowHandle":"<16-lowercase-hex>","foregroundProcessId":1,"clipboardSequenceNumber":1}}
```

The successful result has exactly `operation: "paste-clipboard"` and `outcome: "paste-issued"`. The host accepts no arbitrary key name/code/sequence, executable, command, path, URL, page/editor/Snippet/customer data, HTML, or image bytes in either new operation. Unknown, duplicate, extra, inexact, oversized, or wrong-version fields fail closed. Request correlation and authorization identity are never treated as permission to bypass the current native checks.

### Input, modifiers, concurrency, and results

Immediately before input, the host samples left/right Ctrl, Shift, Alt, and Windows high-order key state. Any modifier down returns `unsafe-keyboard-state`; there is no keyboard hook, `BlockInput`, polling loop, or wait for release. The approved single `SendInput` array is Ctrl down, V down, V up, Ctrl up using virtual-key accelerator semantics. It pastes the existing clipboard instead of typing content, so no Unicode or keyboard-layout translation of the Snippet payload occurs.

Exactly four accepted events yield application outcome `paste-issued`; this means Windows accepted the events, not that a destination inserted them. Zero accepted events yields `input-injection-failed`. A partial return, process disconnect, timeout, or lost response after input may have begun yields `indeterminate`. The requested balanced four-event array is the only approved modifier-state measure: the host issues no speculative key-up or second sequence after an uncertain result, because it cannot safely know what a later input would duplicate or which physical state changed. One activation permits at most one `SendInput` call, and authorization is consumed before it.

The extension-wide delivery guard has no queue. A second activation rejected before its own clipboard preparation keeps its trigger plus ordinary Space and reports retry-later delivery busy without claiming it was copied. The host adds `Local\AI.SupportWorkspace.ClipboardCompanion.Paste.v2` as a separate immediate-fail per-user/session mutex while preserving the existing Image-write mutex and behavior. Typed automatic-paste outcomes are `paste-issued`, `clipboard-only`, `unsafe-focus`, `not-foreground`, `clipboard-changed`, `unsafe-keyboard-state`, `busy`, `native-unavailable`, `input-injection-failed`, and `indeterminate`; protocol details map to these safe categories. `Paste sent` is truthful automatic-success UI. All automatic non-success outcomes after confirmed clipboard preparation use `Snippet copied — press Ctrl+V` or `Image copied — press Ctrl+V`, with `(trigger unchanged)` if cleanup was not authorized. No automatic retry occurs after input may have begun.

### Security, privacy, and platform disposition

The existing exact allowed-origin and compiled caller-origin checks remain mandatory. Logging remains off by default and there is no network telemetry. Opt-in diagnostics may contain only request/authorization correlation, bounded timing, and result/safety category—not clipboard content, text, HTML, PNG, page/editor content, customer/merchant data, paths, raw JSON, exceptions, or stack traces. Windows is the only M14-K automatic-paste platform. Non-Windows and missing/incompatible companion states remain supported through clipboard-only mode and manual `Ctrl+V`.

## Established Evidence

The architecture begins from the completed real-Chrome feasibility record:

| Candidate | Result | Architectural consequence |
| --- | --- | --- |
| Offscreen Async Clipboard | `REAL-CHROME FAILED` at `stage=offscreen-write`, `code=clipboard-write-failed`, `kind=image`, `phase=clipboard-write` | Do not use the offscreen Async Clipboard Image path as production transport. |
| M14-I.1.4 copy-event `File` | `REAL-CHROME FAILED FOR IMAGE SNIPPET SEMANTICS`; native paste produced `snippet.png` | Keep `REVERT RECOMMENDED` and remove this branch after the native path is validated. Never use file/drop semantics for Image delivery. |
| Focused content-page A1 | `REAL-CHROME FAILED`; native paste produced `TEXT` | Do not depend on focused content-page Async Clipboard for genuine image semantics. |
| Focused extension-page B | `REAL-CHROME PASS`; native paste produced `VISIBLE IMAGE` | Genuine image writing is possible from a focused extension document, but focus-stealing extension UI is not acceptable production UX. |
| A2/F9 | `NOT RUN`; `NO LONGER REQUIRED FOR THE CURRENT DECISION` | Do not reopen browser-only feasibility without new architecture evidence. |
| Windows Native Clipboard Companion | `REAL-CHROME END-TO-END PASS`; Settings reported `Ready`, trigger and copied notice succeeded, and native paste produced a visible genuine image | Selected normal Windows Image transport; failed browser Image mechanisms can be removed. |

The target remains:

```text
Image trigger + Space
-> service worker loads authoritative Image Snippet and owned asset
-> Decision 42 validation/conversion produces genuine PNG
-> second catalog freshness check
-> WindowsNativeImageClipboardTransport
-> one Native Messaging request
-> companion prepares registered PNG + CF_DIBV5
-> verified success response
-> content-side compare-and-swap trigger cleanup
-> "Image copied — press Ctrl+V"
-> manual native Ctrl+V
```

Before verified native success, the trigger, activation Space, surrounding text, selection, and page content remain untouched. If page state becomes stale after successful clipboard preparation, cleanup is skipped and the prepared clipboard is retained; user edits are never overwritten.

## Scope and Non-goals

The companion is a request-scoped infrastructure adapter. Its only v1 data operation is `write-image-png`. Decision 45 permits only the future protocol-v2 paste capability defined above; the host is not a Snippet repository, database client, image-authoring service, JPEG/WebP domain, AI provider, prompt builder, general browser-automation engine, command runner, or updater.

Clipboard requests are local and memory-only. The host accepts no URL, path, filename, asset ID, Snippet ID/title/trigger, HTML, page content, executable name, shell fragment, or arbitrary command. It performs no network access and creates no temporary image file. Manual `Ctrl+V` remains accepted. M14-J, macOS/Linux companions, AutoHotkey, and keyboard hooks remain outside M14-I.2; M14-K.1 defines but does not implement the one narrow protocol-v2 automatic-paste operation.

## Primary-source Findings

### Chrome Native Messaging

The current [Chrome Native Messaging documentation](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging) establishes the following:

- `runtime.sendNativeMessage()` and `runtime.connectNative()` require the `nativeMessaging` permission. They are available to extension pages and the service worker, not content scripts; a content script must relay through the service worker.
- A host manifest is valid JSON with `name`, `description`, executable `path`, `type: "stdio"`, and `allowed_origins`. Origin entries cannot contain wildcards.
- On Windows, the manifest may live anywhere. Chrome discovers it through the default value of `HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\<host-name>` or the corresponding HKLM key; the value is the full manifest path. Chrome checks the 32-bit registry view before the 64-bit view.
- A Windows executable path may be relative to the host-manifest directory, and Chrome starts the process with its current directory set to the binary directory. This architecture nevertheless requires an absolute installed executable path to avoid path ambiguity.
- Messages in both directions are UTF-8 JSON preceded by a 32-bit length in native byte order. Chrome-to-host messages may be at most 64 MiB. Host-to-Chrome messages may be at most 1 MiB. On Windows, host stdio must be binary-safe so newline translation cannot corrupt framing.
- Chrome passes the caller origin as the first process argument. On Windows it also passes `--parent-window=<decimal>`; the value is `0` for a service-worker caller.
- `sendNativeMessage()` starts one host process per message and uses only the first host response. `connectNative()` keeps one process alive until its Port is destroyed.
- Launch, missing-host, forbidden-origin, premature-exit, broken-pipe, invalid-protocol, and port-disconnect conditions are observable failures. `stdout` must contain protocol frames only; diagnostics belong on `stderr`.

The [Runtime API](https://developer.chrome.com/docs/extensions/reference/api/runtime) confirms the permission requirement, the Windows platform value (`win`), and Port disconnect/error behavior. The [service-worker lifecycle documentation](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle) says ordinary extension API calls reset lifecycle timers and a `connectNative()` port gives a stronger keep-alive. V1 does not need that persistent keep-alive: it awaits one bounded `sendNativeMessage()` call and stores no correctness-critical state only in globals.

The [Chrome permissions API](https://developer.chrome.com/docs/extensions/reference/api/permissions) permits most named permissions to be optional and does not list `nativeMessaging` among the exceptions. Optional permission requests must originate in a user gesture. The [permission list](https://developer.chrome.com/docs/extensions/reference/permissions-list) associates `nativeMessaging` with the warning “Communicate with cooperating native applications.” Therefore a later implementation must declare it as optional and request it only from an explanatory Settings action.

The [manifest `key` documentation](https://developer.chrome.com/docs/extensions/reference/manifest/key) defines how a public key keeps an unpacked development extension ID stable. Production and development identities must remain separate.

Chrome is the only v1 browser distribution target. Chromium-derived browsers may use different host discovery keys, policies, signing channels, and extension identities. The clipboard-format evidence below comes from Chromium source, but this decision does not claim Chromium, Edge, or another browser as a supported distribution target.

### Windows Clipboard

The Win32 [OpenClipboard](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-openclipboard), [EmptyClipboard](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-emptyclipboard), [SetClipboardData](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setclipboarddata), and [CloseClipboard](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-closeclipboard) contracts establish that:

- `OpenClipboard` fails while another window has the clipboard open and every successful open must be closed.
- The supplied HWND becomes the clipboard owner when `EmptyClipboard` succeeds. `OpenClipboard(NULL)` followed by `EmptyClipboard` makes the owner NULL and causes `SetClipboardData` to fail, so a real companion-owned HWND is required.
- A successful `SetClipboardData` transfers ownership of the supplied handle to the system. The application must unlock it first and must neither write nor free it afterward. Clipboard memory objects use `GMEM_MOVEABLE`.
- Data supplied eagerly through system-owned handles survives destruction of the owner process. Delayed rendering instead requires the owner to remain and answer window messages; v1 therefore prohibits delayed rendering.

The Win32 [clipboard operations](https://learn.microsoft.com/en-us/windows/win32/dataxchg/clipboard-operations) and [clipboard formats](https://learn.microsoft.com/en-us/windows/win32/dataxchg/clipboard-formats) guidance recommends supplying as many useful representations as possible, most descriptive first. Consumers commonly select the first format they recognize. Windows can synthesize `CF_BITMAP` and `CF_DIB` from `CF_DIBV5`, and Microsoft recommends DIB/DIBV5 over device-dependent `CF_BITMAP`. `CF_BITMAP` is therefore unnecessary in v1.

Chromium's current Windows [clipboard implementation](https://chromium.googlesource.com/chromium/src/+/master/ui/base/clipboard/clipboard_win.cc) writes transparent images as both registered PNG and DIBV5 because applications differ; its source specifically records buggy Word DIBV5 support and writes PNG first so Word selects it. Chromium registers the exact format name `PNG` and uses `CF_DIBV5` in its [Windows clipboard-format implementation](https://chromium.googlesource.com/chromium/src/+/master/ui/base/clipboard/clipboard_format_type_win.cc). Win32's [RegisterClipboardFormat](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerclipboardformata) contract provides the shared registered-format ID. This is direct evidence for Option C and its order.

The [BITMAPV5HEADER contract](https://learn.microsoft.com/en-us/windows/win32/api/wingdi/ns-wingdi-bitmapv5header) defines 32-bit component masks, alpha, sRGB color space, rendering intent, and positive-height bottom-up versus negative-height top-down layout. Chromium's [DIBV5 construction](https://chromium.googlesource.com/chromium/src/+/master/skia/ext/skia_utils_win.cc) deliberately uses a positive height and vertically flips rows because some programs mishandle negative-height DIBs. V1 follows that compatibility choice.

### Decoder and Host Runtime

Microsoft's [WIC overview](https://learn.microsoft.com/en-us/windows/win32/wic/-wic-about-windows-imaging-codec) and [PNG codec documentation](https://learn.microsoft.com/en-us/windows/win32/wic/png-format-overview) identify the built-in Windows PNG decoder. The [WIC native pixel formats](https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-native-pixel-formats) define BGRA byte order and distinguish straight `32bppBGRA` from premultiplied `32bppPBGRA`. V1 uses WIC conversion to premultiplied BGRA for the DIBV5 compatibility representation and preserves the exact validated PNG bytes in the registered PNG representation.

The [.NET support policy](https://dotnet.microsoft.com/en-us/platform/support/policy) identifies .NET 10 as the current active LTS release through November 14, 2028. [.NET native interop guidance](https://learn.microsoft.com/en-us/dotnet/standard/native-interop/best-practices) supports direct Win32 calls. A [self-contained deployment](https://learn.microsoft.com/en-us/dotnet/core/deploying/single-file/overview) removes the end-user runtime prerequisite. [Native AOT](https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/) has attractive startup/footprint properties but requires trimming and has no built-in Windows COM, which raises unnecessary WIC risk for v1.

## Principal Architecture Decisions

The following twenty decisions are complete and binding for a later implementation task.

| # | Recommendation | Alternatives considered | Reason | Risk/tradeoff |
| --- | --- | --- | --- | --- |
| 1. Host technology | C# on .NET 10 LTS, self-contained `win-x64`, framework-based/JIT, direct Win32 interop plus WIC COM. Add `win-arm64` only when distribution demand exists. | Rust; native C/C++; Node; NativeAOT. | Best balance of typed protocol code, Win32/WIC access, tests, maintenance, and no installed runtime. | Larger installed footprint/startup than C++/Rust; runtime files must be patched with host releases. NativeAOT can be reconsidered only after WIC COM and trimming tests. |
| 2. Process model | Service worker calls `runtime.sendNativeMessage()` once per capabilities check or Image write. | Persistent `connectNative()` Port. | One request, one response, automatic process cleanup, no retained PNG memory or reconnect state, and the smallest security surface. | Per-request startup latency; measure before considering a persistent host. |
| 3. Protocol | Exact strict protocol v1 defined below, with only `get-capabilities` and data operation `write-image-png`. | Unversioned JSON; general commands; RPC framework. | Tiny auditable surface, explicit compatibility, and safe deterministic parsing. | Future fields require a new protocol version rather than permissive extension. |
| 4. PNG encoding | Canonical RFC 4648 base64 in one JSON string, with declared decoded `byteLength`. | Numeric byte array; chunking; streaming; temporary file. | Fits Chrome's supported JSON protocol and remains far below its 64 MiB inbound limit. | Base64 and JSON temporarily increase memory. |
| 5. Transport envelope | Maximum framed request body: 7,000,000 UTF-8 bytes. Maximum response body: 4,096 UTF-8 bytes. | Chrome's full 64 MiB/1 MiB limits. | Enforces the application limit before large allocation and leaves large safety margins. | Fixed limits require protocol review if Decision 42 changes. |
| 6. Native validation | Repeat encoded size, canonical base64, PNG signature/IHDR, axis/pixel/decoded-size guards, WIC container/frame/dimensions, and post-decode dimensions. | Trust the extension; duplicate all JPEG/WebP logic. | Defense in depth without creating another image application domain or inconsistent limits. | Some validation is intentionally duplicated and must share conformance fixtures. |
| 7. Clipboard formats | Option C: registered `PNG` first, then `CF_DIBV5`; both required for success. No `CF_HDROP`, `CF_BITMAP`, filename, or file object. | A: DIBV5 only; B: PNG only; D: DIB/bitmap/file combinations. | Matches Chromium's compatibility strategy, preserves encoded alpha fidelity, and provides a broadly recognized bitmap fallback. | Two allocations/writes and a non-atomic multi-format sequence. |
| 8. Decode/conversion | Windows Imaging Component PNG decoder and format converter to premultiplied 32bpp BGRA for DIBV5. | GDI+/System.Drawing; third-party codec; custom PNG decoder. | Built into Windows, no extra codec dependency, and exact bounded pixel output. | WIC is COM and needs explicit lifetime/error handling. |
| 9. Clipboard ownership | Dedicated STA request thread creates an unshown top-level native HWND, eagerly renders both formats, then uses Open/Empty/Set/Set/Close. | `OpenClipboard(NULL)`; Chrome parent HWND; message-only/no window; delayed rendering. | A non-NULL owner HWND is required; the service-worker parent handle is 0; eager data remains after host exit. | Window-class/COM lifecycle adds small native complexity. |
| 10. Retry policy | Six total `OpenClipboard` attempts with 10, 20, 40, 80, and 160 ms waits: at most 310 ms total delay. Retry only pre-mutation contention. | No retry; fixed long delay; unbounded retry; whole-operation retry. | Handles ordinary transient contention without hiding failure or duplicating a possibly successful write. | Busy clipboard can still fail visibly after 310 ms. |
| 11. Success | Return success only after the HWND-owned Open -> Empty -> registered PNG Set -> CF_DIBV5 Set -> Close sequence succeeds. | Success after launch, decode, or first format. | Makes success strong enough to authorize trigger cleanup without claiming destination paste. | A close/response failure can leave the clipboard prepared but must still report failure. |
| 12. Errors | Stable safe host and extension taxonomies defined below; never surface raw native/Chrome/exception text in normal UI. | One generic error; raw HRESULT/Win32/exception strings. | Actionable UX and tests without leaking data or making implementation details contractual. | Internal diagnosis requires explicitly enabled privacy-safe diagnostics. |
| 13. Extension identity | Exact `allowed_origins` plus host-side exact origin verification. Production and development artifacts each compile exactly one allowed extension origin; no wildcard or runtime broadening. | Manifest-only check; caller-provided ID; wildcard; shared mutable allowlist. | Two independent checks protect the tiny privileged boundary. | Release identity must be fixed before implementation packaging. Same-user compromise remains outside this boundary. |
| 14. Development registration | Stable dev extension ID via a development manifest `key`; separate `com.ai_support_workspace.clipboard.dev` manifest, dev host artifact, exact dev origin, and HKCU registration. | Ephemeral unpacked IDs; adding dev ID to production host; manually editing production manifest. | Repeatable local tests without weakening production trust. | Requires a build-profile decision and safe handling of the public key value. |
| 15. Production installation | Signed per-user installer; self-contained host under `%LOCALAPPDATA%\AI Support Workspace\Clipboard Companion\`; exact HKCU Google Chrome registration; absolute manifest/executable paths; transactional versioned upgrade and complete uninstall. Installer technology remains an implementation selection. | Machine-wide/admin install; loose ZIP/manual registry; MSIX commitment now. | Avoids elevation, supports Chrome's documented registration, and gives repair/uninstall ownership. | Enterprise policy can disable user-level hosts; signing/reputation and installer choice remain release work. |
| 16. Version compatibility | Separate semantic `hostVersion` from integer `protocolVersion`; v1 is exact and frozen. A newer host must continue exact v1 behavior; an unsupported version fails explicitly. | Extension-version lockstep; loose feature guessing. | Allows independent updates and safe rollback without complex negotiation. | Breaking protocol changes require parallel-version support or coordinated update. |
| 17. Extension boundary | Application capability `ImageClipboardTransport.writePng`; Windows infrastructure implementation `WindowsNativeImageClipboardTransport`; existing browser Text transport remains independent. | Native calls in content script/domain/planner; provider-specific branches. | Preserves authoritative planning, Decision 42, metadata-only catalogs, freshness, and compare-and-swap cleanup. | Requires a narrow adapter and response-validation layer in implementation. |
| 18. Concurrency | One service-worker Image write in flight, no automatic queue or retry; a second activation fails safely as busy. Host also takes a per-user/session single-instance write mutex and rejects overlap. | Parallel writes; unbounded FIFO; automatic resend. | Prevents late requests from silently replacing a newer intended clipboard and bounds host work. | A rapid second user action must be retried explicitly. |
| 19. Probe cleanup | Before final M14-I commit, remove all feasibility-probe runtime/dev UI and probe-only tests; retain the feasibility document. Retain/move only a generic deterministic PNG fixture if a real native conformance test uses it. | Ship dormant probe; delete historical evidence. | Avoids a permanent hidden capability while preserving decision history. | Cleanup must wait until assigned so current evidence remains reproducible. |
| 20. M14-I.1.4 cleanup | After the native path is implemented and validated, remove the File-based Image production branch, its obsolete Image-only errors/tests, and obsolete offscreen Image transport; preserve validated Text offscreen copy-event code/tests and historical documentation. | Revert now; keep fallback; remove all clipboard code. | Eliminates a proven-wrong representation without disturbing Text or Decision 42. | Must be sequenced after replacement validation and reviewed for shared code. |

### Technology comparison detail

- **C#/.NET 10 LTS — selected:** first-party typed interop, mature JSON/testing support, direct Win32 P/Invoke, usable WIC COM, and self-contained distribution give the smallest maintainable surface for this repository. The accepted cost is a larger folder and JIT startup. V1 deliberately avoids trimming, self-extracting single-file packaging, and NativeAOT complexity.
- **Rust — rejected for v1:** produces a compact native binary and offers strong memory-safety guarantees, but Win32/COM bindings, toolchain ownership, unsafe boundary review, and a second unfamiliar ecosystem increase implementation and long-term maintenance cost for this narrow adapter.
- **Native C/C++ — rejected for v1:** provides the most direct Win32/WIC access and potentially smallest binary/startup cost, but manual memory/framing/COM ownership at an attacker-influenced native boundary creates the highest memory-safety and test burden.
- **Node — rejected:** it aligns with TypeScript but would require a separately deployed runtime or bulky bundling and adds no benefit to Win32/WIC ownership. A user-installed Node prerequisite is prohibited.

### Process-model comparison detail

`sendNativeMessage()` pays one process startup per check/write but naturally bounds lifetime, state, decoded memory, upgrade behavior, and failure recovery. `connectNative()` would reduce repeated startup but holds a process and Port, strongly extends service-worker lifetime, needs reconnect/version invalidation, retains more state, and expands concurrency/security complexity. Snippet Image writes are explicit human actions rather than a high-frequency stream, so v1 selects one-shot processes. Persistent connection is eligible only after measured end-to-end latency proves the one-shot design misses an approved UX target.

### Clipboard-format comparison detail

- **Option A — `CF_DIBV5` only:** standards-backed bitmap and alpha support, but Chromium records real application incompatibility, specifically Word. Rejected.
- **Option B — registered `PNG` only:** preserves exact encoded alpha/color data and works around Word's DIBV5 behavior, but consumers recognizing only standard bitmap formats would have no fallback. Rejected.
- **Option C — registered `PNG` then `CF_DIBV5`:** selected. It follows Chromium's evidence-backed ordering and gives exact PNG fidelity plus a standard alpha-capable bitmap representation.
- **Option D — `CF_DIB`, `CF_BITMAP`, file/drop, or additional formats:** `CF_BITMAP` is device dependent and Windows can synthesize it from DIBV5; older `CF_DIB` has no explicit alpha/color-space contract and can also be synthesized; file/drop reintroduces the proven-wrong `snippet.png` semantics. No additional v1 format is justified.

## Exact Protocol v1

### Common Rules

- One native process reads exactly one declared frame, processes it without waiting for stdin EOF or inspecting process-lifetime stdin beyond that frame, writes exactly one framed response, flushes stdout, and exits.
- UTF-8 JSON object only. Duplicate keys, dangerous keys, invalid UTF-8, non-finite numbers, and trailing JSON content inside the declared body are `invalid-request`. After the common version/request-ID envelope is identified, protocol v1 rejects unknown fields at every object level as `invalid-request`.
- `protocolVersion` is the integer `1`.
- `requestId` is exactly 32 lowercase hexadecimal characters (`^[0-9a-f]{32}$`), generated by the service worker from 128 cryptographically random bits. It contains no user data, is not an authentication secret, is never reused within one extension runtime, and is echoed exactly.
- Normal request `requestId` logging is allowed only as the complete bounded 32-character value. If parsing cannot establish a valid request ID, the error response uses `requestId: null` and logs no attacker-supplied substitute.
- `hostVersion` is a bounded SemVer string of at most 32 ASCII characters.
- The declared frame is the complete request boundary. The one-shot host consumes exactly that prefix and body, does not scan or block for later stdin bytes, and exits after its response; `sendNativeMessage()` supplies one request per process.
- Requests over 7,000,000 UTF-8 bytes are rejected from the 32-bit frame length before allocating that body. Responses must not exceed 4,096 UTF-8 bytes.

### Capabilities Request

```json
{
  "protocolVersion": 1,
  "requestId": "0123456789abcdef0123456789abcdef",
  "operation": "get-capabilities"
}
```

Exact keys: `protocolVersion`, `requestId`, `operation`. `operation` must be `get-capabilities`.

### Image-write Request

```json
{
  "protocolVersion": 1,
  "requestId": "0123456789abcdef0123456789abcdef",
  "operation": "write-image-png",
  "image": {
    "encoding": "base64",
    "byteLength": 5242880,
    "data": "<canonical RFC 4648 base64>"
  }
}
```

Exact top-level keys: `protocolVersion`, `requestId`, `operation`, `image`. Exact image keys: `encoding`, `byteLength`, `data`. `operation` must be `write-image-png`; `encoding` must be `base64`; `byteLength` is an integer from 1 through 5,242,880 inclusive; `data` is canonical standard-alphabet padded base64 whose decoded length equals `byteLength`. No whitespace or URL-safe alphabet is allowed.

### Capabilities Success

```json
{
  "protocolVersion": 1,
  "requestId": "0123456789abcdef0123456789abcdef",
  "status": "success",
  "hostVersion": "1.0.0",
  "result": {
    "operation": "get-capabilities",
    "supportedProtocolVersions": [1],
    "supportedOperations": ["write-image-png"],
    "maxPngBytes": 5242880,
    "clipboardFormats": ["png", "cf-dibv5"]
  }
}
```

Arrays and their order are exact for v1. `get-capabilities` performs no clipboard access.

### Image-write Success

```json
{
  "protocolVersion": 1,
  "requestId": "0123456789abcdef0123456789abcdef",
  "status": "success",
  "hostVersion": "1.0.0",
  "result": {
    "operation": "write-image-png",
    "clipboardFormats": ["png", "cf-dibv5"]
  }
}
```

This means only: the companion successfully prepared the Windows clipboard with both approved representations. It does not mean Chrome or a destination pasted the image.

### Error Response

```json
{
  "protocolVersion": 1,
  "requestId": "0123456789abcdef0123456789abcdef",
  "status": "error",
  "hostVersion": "1.0.0",
  "safeErrorCode": "invalid-png"
}
```

`requestId` is `null` only when a valid ID could not be recovered. A v1 host receiving another integer protocol version returns the exact v1 error shape with `protocol-version-unsupported` before applying v1-specific field rules; it never guesses or interprets a future schema. Host and extension reject inexact v1 response shapes. A newer host that advertises v1 must emit this exact v1 response, so additional response fields require a later protocol version.

## Message-size Calculation

Decision 42 permits at most 5 MiB = 5,242,880 encoded PNG bytes. Canonical base64 requires:

```text
4 * ceil(5,242,880 / 3) = 6,990,508 ASCII bytes
```

Using the exact compact maximum-sized v1 request and a 32-character request ID, the JSON envelope excluding base64 is 159 UTF-8 bytes:

```text
6,990,508 + 159 = 6,990,667 bytes
```

The protocol ceiling of 7,000,000 bytes leaves 9,333 bytes of margin and is about 6.67 MiB, well below Chrome's documented 64 MiB extension-to-host maximum. One request safely fits. Chunking, streaming, filesystem handoff, Downloads, watched folders, and `%TEMP%` image files are prohibited.

## Host Validation and Decode Policy

Validation is ordered to reject cheaply before expensive allocation:

1. Validate caller origin and command-line shape before reading the request body.
2. Read the unsigned 32-bit native-endian frame length. Reject zero or greater than 7,000,000 before body allocation.
3. Read exactly the declared number of bytes; reject premature EOF within that frame, invalid UTF-8, non-object JSON, duplicate/dangerous keys, trailing JSON content inside the declared body, and inexact common-envelope types. Do not read ahead or wait for stdin EOF after the body. Extract only `protocolVersion` and a valid `requestId` for correlation.
4. Return `protocol-version-unsupported` for a non-v1 integer before interpreting version-specific fields. For v1, reject every unknown field, validate `requestId`, dispatch only exact operation shapes, then validate `byteLength` and base64 character/padding/length bounds.
5. Decode canonical base64 once. Require decoded length to equal `byteLength` and be at most 5,242,880 bytes.
6. Before WIC, validate the eight-byte PNG signature and mandatory first 13-byte `IHDR` structure with overflow-safe chunk bounds. Read big-endian width and height.
7. Apply Decision 42 unchanged: width and height each 1..8,192; pixel count at most 16,777,216; checked `width * height * 4` at most 67,108,864 bytes. No resize, crop, downsample, or recompression.
8. Decode from an in-memory stream with the Windows-native WIC PNG decoder only. Require PNG container identity and exactly one decodable frame. No JPEG/WebP dispatch or extension-based codec selection exists.
9. Re-read WIC frame width/height and require exact equality with validated IHDR plus all Decision 42 limits.
10. Convert through WIC to `GUID_WICPixelFormat32bppPBGRA`: byte order B, G, R, A with premultiplied alpha. Use checked stride `width * 4` and checked image size `stride * height`; no application-owned second full raster is permitted.
11. Allocate and fill both clipboard HGLOBAL blocks before opening the clipboard: exact original validated PNG bytes and `BITMAPV5HEADER + pixels`. Every allocation is `GMEM_MOVEABLE`; every handle is unlocked before `SetClipboardData`.
12. On every failure, release all still-application-owned HGLOBAL, WIC, COM, decoded-byte, and JSON/base64 resources. After successful `SetClipboardData`, mark that handle system-owned and never free/write it. Release payload references before process exit.

The companion repeats only the PNG-relevant Decision 42 checks. JPEG/WebP signature parsing, animated-WebP rejection, and conversion remain solely in the authoritative extension planner because the host never accepts those formats. This is one consistent policy, not a second application domain.

## DIBV5 Pixel and Color Contract

The DIBV5 fallback is a packed `BITMAPV5HEADER` followed immediately by pixels:

- positive `bV5Width` and positive `bV5Height`, so storage is bottom-up;
- rows copied in vertically reversed order from WIC's top-down logical output, following Chromium's compatibility choice;
- `bV5Planes = 1`, `bV5BitCount = 32`, tightly packed stride `width * 4` (already DWORD-aligned);
- `bV5Compression = BI_BITFIELDS` with red `0x00ff0000`, green `0x0000ff00`, blue `0x000000ff`, and alpha `0xff000000` masks;
- premultiplied BGRA pixel values, preserving alpha in the explicit mask;
- `bV5SizeImage = width * height * 4` using checked arithmetic;
- `bV5CSType = LCS_sRGB`, `bV5Intent = LCS_GM_IMAGES`, no linked/embedded profile, and reserved fields zero.

The registered `PNG` HGLOBAL contains only the exact validated encoded PNG bytes, without a filename, path, MIME wrapper, terminator, file descriptor, or `CF_HDROP`. PNG is written first and DIBV5 second. Both successful registrations and writes are mandatory for native success.

## Clipboard Ownership, Retry, and Failure Atomicity

The one-shot host initializes COM on one dedicated STA thread according to Microsoft's [COM initialization guidance](https://learn.microsoft.com/en-us/windows/win32/learnwin32/initializing-the-com-library), registers a private window class, creates an unshown top-level window owned by that process, and uses its HWND for `OpenClipboard`. It does not use Chrome's service-worker `--parent-window=0`, `OpenClipboard(NULL)`, a visible window, or delayed rendering.

All validation, decode, conversion, and HGLOBAL population occur before clipboard mutation. A per-user/session named mutex prevents overlapping host writes. Clipboard access then follows exactly:

1. Attempt `OpenClipboard(ownerHwnd)` up to six times.
2. On contention only, wait 10, 20, 40, 80, then 160 ms between attempts (310 ms total maximum delay).
3. After open, call `EmptyClipboard` once.
4. Call `SetClipboardData(registeredPngFormat, pngHandle)` once.
5. Call `SetClipboardData(CF_DIBV5, dibv5Handle)` once.
6. Call `CloseClipboard` once and verify success.

Only pre-mutation clipboard contention is retryable. Allocation, validation, decode, `EmptyClipboard`, either `SetClipboardData`, and `CloseClipboard` failures are not retried. The full Native Messaging request is never automatically resent.

Win32 offers no transaction across two `SetClipboardData` calls. If the first Set succeeds and the second fails, the host marks the PNG HGLOBAL as system-owned, keeps the operation failed, performs no transaction retry, and attempts one best-effort `EmptyClipboard` while it still owns the open clipboard. It then attempts `CloseClipboard` and returns `clipboard-write-failed` unless the approved close-failure precedence applies. Cleanup failure does not replace the original write failure, trigger a retry, or justify claiming the clipboard is clean. The host never directly frees a successfully transferred HGLOBAL; Windows owns and frees it as appropriate, while the host releases only the DIBV5 HGLOBAL that never transferred. It cannot restore the prior clipboard because the first `EmptyClipboard` already destroyed it. Therefore a failed request can leave the clipboard empty, partially prepared, or prepared with a response lost; the trigger remains and no copied notice is shown. This residual risk is safer than an automatic retry or false success and is covered by fault-injection tests.

## Error Taxonomy

### Host response codes

| Code | Meaning |
| --- | --- |
| `protocol-version-unsupported` | Parsed request uses a protocol version other than 1. |
| `invalid-request` | Invalid framing/UTF-8/JSON/shape/type/key/request ID/operation-specific contract not covered more specifically. |
| `unsupported-operation` | Parsed operation is not `get-capabilities` or `write-image-png`. |
| `payload-too-large` | Frame, declared PNG bytes, base64 length, or decoded payload exceeds its bound. |
| `invalid-base64` | Base64 alphabet, padding, canonicality, or decoded-length equality fails. |
| `invalid-png` | PNG signature/IHDR/container/frame/structure or dimension-consistency validation fails. |
| `image-too-large` | A Decision 42 axis, pixel, stride, or decoded-surface limit fails. |
| `image-decode-failed` | WIC cannot decode/convert an otherwise structurally eligible PNG. |
| `clipboard-busy` | All bounded contention retries were exhausted, or the companion write mutex is held. |
| `clipboard-open-failed` | `OpenClipboard` failed without observable contention. |
| `clipboard-write-failed` | Allocation, registration, Empty, or either required Set operation fails. |
| `clipboard-close-failed` | Required Close fails after a write attempt; clipboard state is uncertain. |
| `internal-failure` | Safe catch-all for an unexpected host failure. |

### Extension-side classifications

| Code | Meaning |
| --- | --- |
| `native-permission-required` | Optional `nativeMessaging` is absent. |
| `host-unavailable` | Host/manifest/registry/executable is absent, forbidden, cannot launch, exits early, or disconnects without a valid response. Normal UI says the Windows Image Clipboard Companion is required or needs repair. |
| `host-version-mismatch` | Host responds but does not provide exact compatible protocol/capabilities. Normal UI asks the user to update the extension or companion. |
| `invalid-host-response` | Response framing/shape/request correlation/status is invalid or stale. |
| `native-delivery-busy` | Another Image activation is already in flight in the extension. |

Normal UI maps codes to bounded user guidance and never displays raw exception text, stack traces, HRESULTs, Win32 messages, host paths, registry data, or Chrome `runtime.lastError` text.

## Logging and Privacy

`stdout` is reserved exclusively for the single length-prefixed Native Messaging response. Debug text on stdout is a protocol defect. Production logging defaults OFF.

An explicitly enabled developer diagnostic mode may write bounded structured events to `stderr` only: event name, safe error code, host/protocol version, request ID only after strict validation, operation enum, stage enum, elapsed-millisecond bucket, and numeric dimensions/byte counts after validation. It must never log PNG/base64/clipboard bytes, Snippet title, trigger, asset/Snippet ID, filename/path arguments, page content, HTML, URL, raw JSON, arbitrary caller text, raw exception objects/messages, stack traces, clipboard content, or filesystem dumps. There is no telemetry or network sink.

## Authentication and Extension Identity

The production host name is `com.ai_support_workspace.clipboard`; development uses `com.ai_support_workspace.clipboard.dev`. Each host manifest contains exactly one `allowed_origins` value with a trailing slash:

```text
chrome-extension://<exact-32-character-extension-id>/
```

Wildcards and multiple convenience IDs are forbidden. Before reading a body, the host compares Chrome's first process argument byte-for-byte with the one compile-time allowed origin for that artifact. It also validates the expected host execution shape and ignores `--parent-window` for ownership because a service-worker call supplies zero. The origin is an access restriction, not a defense against compromise of the trusted extension or same-user replacement of installed files.

The production extension ID comes from the Chrome Web Store item and must be fixed before release-host packaging. The development WXT/manifest build later receives a stable public `key` and its derived ID is recorded as a build input. A separate development artifact embeds only that dev origin and registers only the `.dev` host. The production installer never installs the dev host, trusts the dev ID, or accepts installer-supplied arbitrary IDs.

## Permission and Capability UX

`nativeMessaging` is declared under `optional_permissions`, not required permissions. Settings provides an explicit Windows-only “Enable Image Clipboard Companion” action that explains the Chrome warning, local PNG transfer, helper installation, manual paste, and absence of network/temporary image files. Only that user gesture requests permission.

Capability state is derived without polling:

1. `runtime.getPlatformInfo()` must report `os: "win"`.
2. `permissions.contains({ permissions: ["nativeMessaging"] })` determines grant state.
3. When the user explicitly checks Settings, or on the first Image delivery in an extension runtime after a grant, `get-capabilities` determines host availability and exact v1 compatibility.
4. A successful Image write also returns host/capability evidence. Any launch/protocol failure invalidates the in-memory readiness cache.

No helper is launched for normal Text typing, Text planning, or Text clipboard delivery. Image activation without permission or a compatible host preserves the trigger and shows safe setup/update/repair guidance. Permission denial and revocation are normal supported states.

## Installation and Distribution

### Development

The repeatable developer script/build task now:

- build the self-contained dev host artifact with the exact stable dev origin;
- install it below a developer-owned `%LOCALAPPDATA%\AI Support Workspace\Clipboard Companion Dev\<version>\` directory;
- write the exact `.dev` native-host manifest with an absolute executable path;
- create only the exact HKCU Google Chrome host key;
- verify host/version/origin/capabilities;
- support idempotent reinstall/update and exact unregister/uninstall cleanup.

It must never edit or reuse the production manifest/key and must not require administrator elevation.

### Production

Production uses a signed per-user installer and a self-contained folder deployment, initially `win-x64`, below `%LOCALAPPDATA%\AI Support Workspace\Clipboard Companion\`. The stable host-manifest location and HKCU registration point to an absolute executable in a versioned, installer-owned directory. Upgrade stages and verifies the complete new version before atomically switching the manifest path; it retains one prior compatible version for rollback, then removes obsolete owned versions. Uninstall removes the exact registry key, manifest, host files, and installer-owned empty directories after active processes exit. Repair recreates only those owned artifacts.

Both installer and executable require trusted Authenticode signing for production, following Microsoft's [Windows code-signing guidance](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options). Signing reduces replacement warnings and establishes publisher integrity, but reputation is a release/distribution concern rather than protocol authentication. MSI versus signed EXE/bootstrapper remains deliberately deferred to the implementation/packaging task because the architecture does not yet require one technology. Machine-wide HKLM installation is not v1 default; managed environments that disable user-level native hosts require a separately approved enterprise deployment path.

Chrome extension and companion versions ship independently. The extension sends protocol 1. A newer host must retain exact v1 behavior; a newer extension retains the v1 parser while supporting v1. Extension-ahead/helper-behind becomes `host-version-mismatch` and update-required UX. Helper-ahead/extension-behind continues through preserved v1. Rollback is safe only to a version supporting the counterpart's protocol. No host updater or network call is part of clipboard v1.

## Repository and Extension Boundaries

If implementation is approved, the focused host lives conceptually at:

```text
native/
  windows-clipboard-companion/
```

That project owns Native Messaging framing, strict host DTOs, caller verification, WIC, Win32 clipboard operations, native memory, and host tests. It may not depend on live TypeScript domain entities. It knows only protocol v1 bytes and enums.

The extension application layer owns a platform-independent `ImageClipboardTransport.writePng` capability. The Windows infrastructure adapter owns `runtime.sendNativeMessage`, host name, strict response parsing, and extension-side error mapping. The service worker continues to own authoritative Snippet/asset loading, Decision 42, PNG conversion, catalog freshness, request correlation, and cleanup authorization. Content scripts remain native-host unaware and metadata-only catalogs remain unchanged.

The exact protocol section in this document is normative. A future implementation adds language-neutral canonical valid/invalid JSON fixtures and size-boundary vectors consumed by both TypeScript and C# tests. DTOs are implemented independently in each language and must pass the same fixtures; no live domain type is shared or serialized. Generation is unnecessary for v1 and may not replace explicit validation.

## Concurrency, Idempotency, and Lost Responses

- The extension admits one Image clipboard request at a time. A rapid second activation fails with `native-delivery-busy`; it is not queued and its editor state is unchanged.
- A one-shot host processes exactly one request. A per-user/session named mutex rejects overlap from another host process as `clipboard-busy`.
- Request IDs correlate responses and suppress stale responses; they are not authentication or durable idempotency keys. The host persists no request cache.
- The extension rejects a duplicate in-flight request ID before launch. A completed ID is never automatically replayed.
- No automatic service-worker retry occurs after `sendNativeMessage` starts. Clipboard success followed by lost response is indistinguishable from failure, so retry could overwrite newer clipboard intent.
- A response whose request/editor/catalog state is stale cannot authorize cleanup. If the host succeeded, the clipboard remains prepared but the trigger and page remain untouched.
- If Chrome disconnects while the host writes, the host completes its bounded request or fails and exits. It does not attempt page cleanup. The extension treats the missing verified response as failure.
- If the write succeeds but the response is lost, the trigger remains, no copied notice appears, and the user may explicitly activate again. This is an accepted at-least-once user intent with no automatic replay.

## Threat Model

| Threat | Boundary | Mitigation | Residual risk |
| --- | --- | --- | --- |
| Malicious/invalid Native Messaging message | Chrome stdin -> host parser | Exact origin before body; 7,000,000-byte frame limit; strict UTF-8/JSON/schema/enums; consume exactly one declared frame without post-body read-ahead. | A compromised trusted extension can still send allowed operations. |
| Incorrect or compromised extension caller | Host manifest/process boundary | One exact `allowed_origins`; host-side compile-time origin check; separate prod/dev artifacts; no wildcard. | Same-user compromise can replace extension/host/manifest unless OS/signing controls detect it. |
| Oversized base64 | Framing/base64 decoder | Reject frame and encoded/decoded bounds before large allocation; canonical length check. | JSON/base64 has bounded temporary overhead. |
| Malformed PNG | PNG parser/WIC | Signature and bounded IHDR parsing before WIC; require PNG container, one frame, matching post-decode dimensions. | Bugs in Windows' WIC PNG decoder remain platform risk. |
| Decompression bomb/extreme dimensions | Encoded -> decoded memory | Decision 42 8,192 axes, 16,777,216 pixels, 64 MiB surface before and after decode; no resize. | WIC may have undocumented bounded internal overhead. |
| Integer overflow | Length/stride/allocation arithmetic | Checked unsigned conversions and multiplication/addition for frame, base64, pixel, stride, header, and allocation sizes. | Implementation defects require boundary/fuzz tests. |
| Repeated clipboard requests | Content/service worker/host | One in flight, no queue/retry, per-user/session host mutex, bounded process/request lifetime. | A compromised same-user process can invoke its own clipboard APIs independently. |
| Clipboard contention | Win32 global clipboard | Six bounded Open attempts/310 ms; retry only before mutation; safe busy/open errors. | Another process can keep the clipboard unavailable. |
| Protocol desynchronization | stdin/stdout framing | Binary stdio, stdout protocol only, exact one declared request frame/response, no EOF dependency or post-body read-ahead, bounded response, flush then exit. | Host crash can still produce a lost/invalid response. |
| Stdout corruption | Host process | No logs on stdout; top-level response writer owns it; diagnostics off/stderr only. | Third-party runtime/native output would be a protocol defect; dependencies must be audited. |
| Executable replacement/tampering | Installed files/process launch | Per-user installer ownership, absolute paths, signed installer/binary, staged upgrades, host-side origin check. | Standard users control their profile; code signing is not a complete same-user sandbox. |
| Host path manipulation | Registry/manifest/executable | Exact installer-owned HKCU key, stable manifest, absolute executable path, no PATH lookup, repair/uninstall ownership. | Same-user registry/file modification can deny service or redirect until signature verification/repair. |
| Arbitrary-command injection | Protocol/host dispatch | Two exact operations; no command/path/URL/HTML/filename fields; no shell/process launch from requests. | Native memory/parser bugs remain possible. |
| Image leakage to logs/files | Diagnostics/memory | Logging off; forbidden payload/user fields; no network/temp image files; release all request memory; no dumps by host. | OS crash dumps, clipboard history, or destination apps are outside the host's control. |
| Stale request/response | Async extension workflow | 128-bit request IDs; exact echo; in-flight correlation; pre-write freshness; post-write compare-and-swap; no retry. | Clipboard may be prepared while cleanup is safely skipped. |
| Extension/host upgrade mismatch | Distribution/protocol | Separate app/protocol versions, exact capabilities, frozen v1, update-required classification, compatibility-aware rollback. | Users can remain broken until they update or repair the companion. |

Windows clipboard history or cloud synchronization is operating-system behavior outside the companion. The helper neither enables nor uploads to it. Product requirements may later decide whether to set Windows history/sync exclusion formats; v1 does not silently alter the user's OS clipboard-history policy.

## Implementation and Remaining Approval Gates

M14-I.3/M14-I.3.1 implement the approved native foundation. M14-I.4/M14-I.4.1 implement the Chrome development integration and corrected capability path: a stable `native-dev` identity, optional Settings-granted `nativeMessaging`, Windows-only service-worker transport, strict TypeScript protocol-v1/golden-fixture validation, and reversible `.dev` HKCU registration. The following gates are implemented or remain applicable:

- shared protocol conformance fixtures for exact valid/invalid shapes, unknown/duplicate/dangerous keys, base64 boundaries, 7,000,000-byte framing, response limit, request correlation, and version mismatch;
- host unit/fuzz tests for PNG/IHDR/dimension/overflow/WIC failures and cleanup/ownership fault injection;
- clipboard integration tests that enumerate registered `PNG` first and `CF_DIBV5` second, validate exact PNG bytes, DIBV5 header/masks/row order/alpha, eager lifetime after host exit, and absence of `CF_HDROP`/filename/file staging;
- OpenClipboard contention/retry timing, partial-write cleanup, Close failure, concurrent host mutex, disconnect/lost response, and no automatic retry tests;
- development registration checks for exact HKCU registration, absolute paths, prod/dev isolation, missing manifest/executable, and project-owned cleanup; production installer/repair/upgrade/rollback/signing tests remain future scope;
- extension tests proving optional permission UX, Windows-only detection, Text independence, authoritative planning, both freshness checks, success-before-cleanup, stale-response suppression, compare-and-swap behavior, and safe errors/logs;
- completed real-Chrome proof on Windows that a Decision 42-safe PNG is prepared by the helper and native `Ctrl+V` yields a visible genuine image; the post-cleanup smoke test passed with Settings Ready, trigger disappearance, copied notice, and visible-image paste.

M14-I is complete at committed/pushed checkpoint `ebe915f`. M14-J.2 is real-Crisp Text PASS, and M14-J.3 pre-delivery Shadow DOM editor/range resolution plus ordinary rich Text are real-Intercom PASS. M14-J.4 retains canonical list serialization and corrects generic inline hard breaks. M14-J.5 proves the initial apparent list failure used an invalid two-item fixture; the corrected three-item record passes persistence, serializer, delivery-payload equality, and normal Intercom paste. Crisp and Intercom Image destination paste pass. Intercom bullet triggering after Shift+Enter remains a known low-priority compatibility limitation. The native-dev diagnostic changes no clipboard or native boundary.

## Cleanup and Handoff

Real-Chrome Image validation passed before cleanup. M14-I.5 removed the failed browser Image paths while preserving the Text path and feasibility history. M14-J is complete, real-browser validated, and synchronized at `e4e9645`; it changed no native clipboard boundary. M14-K.1 / Decision 45 now defines the separate automatic-paste extension without implementing it. The exact next engineering task after Principal approval is M14-K.2 — Windows Automatic Paste Implementation; M14-K.3 then validates Crisp/Intercom Text/Image and adversarial focus behavior.

Implementation sequence:

```text
M14-I.2 architecture
-> Principal approval
-> M14-I.3 native foundation
-> Principal review
-> M14-I.4 Chrome integration and development registration
-> real-Chrome Windows Image validation
-> M14-I.5 remove M14-I.1.4 failed Image File/offscreen Image branch
-> remove feasibility-probe code and probe-only tests
-> preserve validated Text transport and feasibility history
-> final M14-I review and checkpoint
-> M14-J destination compatibility validation
-> M14-J lifecycle closeout at e4e9645
-> M14-K.1 optional automatic-paste architecture and focus safety
-> Principal approval
-> M14-K.2 Windows implementation
-> M14-K.3 Crisp/Intercom real-world validation
```

Backup v5, Dexie v5, Decision 42, metadata-only trigger catalogs, Decision 40, and M15 remain unchanged.
