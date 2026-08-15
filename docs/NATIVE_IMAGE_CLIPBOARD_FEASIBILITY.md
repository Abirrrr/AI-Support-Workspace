# M14-I.1.5.2 Native Image Clipboard Feasibility Conclusion

## Status and Evidence Discipline

This document is the historical technical record for the completed browser feasibility investigation. Evidence is classified as `SPEC ONLY`, `CHROME DOCUMENTED`, `CHROMIUM IMPLEMENTED`, `AUTOMATED TESTED`, `REAL-CHROME PASS`, or `REAL-CHROME FAILED`. Native `Ctrl+V` established the actual Chrome/Windows clipboard representation. The A1/A2/B probe procedures are historical and their runtime code is no longer executable after M14-I.5 cleanup.

Text delivery remains `REAL-CHROME PASS` and unchanged. The Windows Native Clipboard Companion is the selected normal Windows Image architecture and is `REAL-CHROME END-TO-END PASS` through the development integration.

## Authoritative Real-Chrome Findings

1. **Offscreen Async Clipboard — REAL-CHROME FAILED.** The Decision 42-gated offscreen `ClipboardItem({ 'image/png': pngBlob })` / `navigator.clipboard.write()` path failed at `stage=offscreen-write`, `code=clipboard-write-failed`, `kind=image`, `phase=clipboard-write`.
2. **M14-I.1.4 File copy event — REAL-CHROME FAILED FOR IMAGE SNIPPET SEMANTICS.** A genuine validated PNG was wrapped in `File("snippet.png", { type: "image/png" })`, added through `clipboardData.items.add(file)`, and reported command success. Native paste produced `snippet.png`, not an image. Filename changes cannot correct the representation, and JPEG/WebP were intentionally not repeated through the same failed final transport.
3. **Candidate A1 focused content — REAL-CHROME FAILED FOR GENUINE IMAGE CLIPBOARD SEMANTICS.** The first 1 × 1 attempt was `INCONCLUSIVE` because it was visually unverifiable. M14-I.1.5.1 replaced it with a deterministic visible 232-byte 96 × 96 PNG. The trusted focused-page `F8` rerun completed, but native `Ctrl+V` produced `TEXT`, not an image.
4. **Candidate B focused extension page — REAL-CHROME PASS.** The focused AI Support Workspace options page wrote the same deterministic 96 × 96 PNG through `ClipboardItem({ 'image/png': blob })`; native `Ctrl+V` into a rich editor produced `VISIBLE IMAGE`.

Candidate B proves that Chrome can place a genuine `image/png` representation onto the Windows clipboard from a focused extension document. It does not prove a transparent route from the normal trigger workflow.

## A2 Disposition

Candidate A2 / `F9` is:

```text
NOT RUN
NO LONGER REQUIRED FOR THE CURRENT DECISION TREE
```

A1 already failed for genuine Image semantics while Candidate B passed. This establishes the current execution-context boundary without another asynchronous focused-content test. A2 must not be requested again unless a future architecture task reopens it for a justified reason.

## Primary-Source Findings

| Primary source | Specific supported behavior | Evidence level |
| --- | --- | --- |
| [Chrome `chrome.offscreen`](https://developer.chrome.com/docs/extensions/reference/api/offscreen) | MV3 service workers have no DOM; offscreen documents provide a hidden document, support the `CLIPBOARD` reason, and cannot be focused. | CHROME DOCUMENTED |
| [Chrome extension permission list](https://developer.chrome.com/docs/extensions/reference/permissions-list) | `clipboardWrite` permits cut/copy through the web Clipboard API. It is not a native bitmap extension API. | CHROME DOCUMENTED |
| [W3C Clipboard API](https://www.w3.org/TR/clipboard-apis/) | Async Clipboard is exposed on `Window`, defines `ClipboardItem`, makes PNG a mandatory image write type, and specifies advisory `presentationStyle` values. | SPEC ONLY |
| [Chromium `ClipboardPromise`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/clipboard/clipboard_promise.cc) | Blink checks document focus before permission; extension permission can remove the activation dependency but not focus. | CHROMIUM IMPLEMENTED |
| [Chromium extension clipboard permission bridge](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/renderer/chrome_content_settings_agent_delegate.cc) | An extension script context with `clipboardWrite` is allowed to write, and focused privileged extension pages receive the compatibility grant. | CHROMIUM IMPLEMENTED |
| [Chromium `ClipboardItem` implementation](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/clipboard/clipboard_item.cc) | `image/png` is an explicitly supported standard write type. | CHROMIUM IMPLEMENTED |
| [Chromium Async Clipboard writer](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/clipboard/clipboard_writer.cc) | The PNG writer validates/decodes PNG and calls the native system image writer rather than a file-item path. | CHROMIUM IMPLEMENTED |
| [Chromium Windows clipboard implementation](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/ui/base/clipboard/clipboard_win.cc) | Windows bitmap/PNG formats and filename/drop formats are distinct clipboard categories. | CHROMIUM IMPLEMENTED |
| [ChromeOS Platform Apps `chrome.clipboard`](https://developer.chrome.com/docs/apps/reference/clipboard) | `chrome.clipboard.setImageData` is a historical ChromeOS Platform Apps API, not a normal Windows MV3 option. | CHROME DOCUMENTED |
| [Chrome Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging) | Native Messaging communicates with a separately installed/registered native application and requires `nativeMessaging`. | CHROME DOCUMENTED |

## Feasibility Matrix

| Candidate | Real-Chrome result | Conclusion | Product disposition |
| --- | --- | --- | --- |
| Offscreen Async Clipboard | `clipboard-write-failed` | REAL-CHROME FAILED | Historical evidence; not viable |
| M14-I.1.4 File copy event | Native paste: `snippet.png` | REAL-CHROME FAILED for Image semantics | Removed from active runtime in M14-I.5 |
| A1 focused content immediate | Native paste: `TEXT` | REAL-CHROME FAILED for genuine Image semantics | Not viable under the tested context |
| A2 focused content after round trip | Not run | No longer required for the current decision | Do not request without a future justified reopening |
| B focused extension document | Native paste: `VISIBLE IMAGE` | REAL-CHROME PASS | Capability control only; unacceptable production UX |
| Windows native companion | Settings `Ready`; trigger/native preparation/cleanup/notice passed; native paste produced a visible genuine image | REAL-CHROME END-TO-END PASS | Selected normal Windows Image architecture |

## Browser-Only Feasibility Conclusion

```text
extension-only genuine Image clipboard:
TECHNICALLY POSSIBLE IN FOCUSED EXTENSION PAGE

transparent normal trigger integration:
NOT PROVEN / CURRENTLY UNSOLVED
```

No transparent extension-only production route has been proven that can perform the required genuine Image clipboard write from the existing normal Snippet trigger workflow without shifting focus to a visible extension document. This is a conclusion about the tested execution contexts and current architecture, not a claim that Chrome extensions fundamentally cannot write images.

Candidate B must not become the product workflow. Opening or focusing an options/extension page on every Image Snippet expansion would steal focus and violate the intended trigger → copy → manual `Ctrl+V` experience.

## Final M14-I Conclusion

```text
Windows Native Clipboard Companion
→ selected production architecture
→ real-Chrome end-to-end validated
```

This is an architecture and runtime-validation conclusion, not a production-packaging claim. The current validated integration uses the stable development identity and registered `.dev` host; installer, signing, production identity, and production registration remain future work.

## M14-I.1.4 Disposition

```text
M14-I.1.4 — Image copy-event File transport
Disposition: CLEANUP APPROVED
Status: REMOVED FROM ACTIVE RUNTIME IN M14-I.5
```

The File path wrote the wrong representation and risked misleading success behavior and dead complexity. After the replacement native path passed, M14-I.5 removed the `File("snippet.png")`, `clipboardData.items.add(file)`, Image offscreen branch, Image-only message/error variants, and tests that existed solely for the failed behavior. The validated Text copy-event path remains intact.

## M14-I.2 — Windows Native Clipboard Companion Architecture

M14-I.2 / Decision 43 now defines the architecture. It selects a Windows-only optional `ImageClipboardTransport` infrastructure adapter, one-shot `runtime.sendNativeMessage()`, a self-contained C#/.NET 10 LTS host, strict bounded base64 PNG protocol, PNG-relevant Decision 42 revalidation, WIC decoding, registered `PNG` first plus `CF_DIBV5` second, a companion-owned HWND, bounded clipboard contention retry, exact production/development origins, per-user installation, and verified-success-before-cleanup semantics. The normative design is `NATIVE_CLIPBOARD_COMPANION_ARCHITECTURE.md`.

At M14-I.2 this remained architecture only. M14-I.3/M14-I.3.1 implement the standalone native project and host foundation. M14-I.4/M14-I.4.1 implement the Chrome development integration, stable dev identity, optional `nativeMessaging`, reversible `.dev` HKCU registration, and corrected readiness path. Real Chrome validates Settings `Ready` plus complete Image trigger/native preparation/cleanup/notice/visible paste. M14-I.5 removes the superseded browser runtime. Production installer, signing, production identity/registration, AutoHotkey, and automatic paste remain absent.

Conceptual boundary:

```text
Image Snippet trigger
→ authoritative Snippet/asset planning
→ Decision 42 validated PNG
→ Chrome Native Messaging
→ installed Windows clipboard companion
→ genuine Windows image clipboard write
→ confirmed success
→ safe compare-and-swap trigger cleanup
→ "Image copied — press Ctrl+V"
→ native Ctrl+V
```

The architecture resolves:

- **Security:** exact manifest and compile-time caller origins, 7,000,000-byte request bound, strict parsing, request-scoped byte ownership, no arbitrary commands, and production logging off.
- **Installation:** future signed per-user `%LOCALAPPDATA%` self-contained deployment, exact HKCU manifest registration, absolute executable path, staged upgrade/rollback, repair, and complete uninstall.
- **Protocol:** exact strict protocol v1 with `get-capabilities` and only data operation `write-image-png`, 32-lowercase-hex request IDs, canonical base64, a 7,000,000-byte request ceiling, a 4,096-byte response ceiling, confirmed status, and bounded safe error codes.
- **Clipboard behavior:** exact validated registered `PNG` first plus bottom-up premultiplied-alpha sRGB `CF_DIBV5` second, no file semantics, and success only after Open/Empty/Set/Set/Close.
- **Decision 42:** all established inspection, decode, conversion, and memory constraints remain authoritative before transfer, with applicable PNG checks repeated by the host.
- **Failure:** before confirmed native clipboard success, the trigger and page remain untouched and no copied notice appears.
- **Privacy:** only request-scoped validated PNG bytes plus exact protocol metadata cross. Filename, path, asset/Snippet ID, title, trigger, page content, URL, and HTML are forbidden.

## Automatic Native-Paste Separation

A future companion might later offer optional Windows-level `Ctrl+V`/input injection, but this is separate from native image clipboard writing. Clipboard writing comes first. Automatic paste requires separate focus/race-safety approval, remains optional and separable, and has no approved AutoHotkey or `SendInput` implementation. Manual `Ctrl+V` remains accepted and is the fallback.

## Current Native Implementation Status

```text
nativeMessaging permission: OPTIONAL / SETTINGS USER ACTION ONLY
Native Messaging development host: IMPLEMENTED / REGISTERED
Windows executable/helper: IMPLEMENTED FOR DEVELOPMENT
Settings companion readiness: REAL-CHROME PASS
Native Image end-to-end: REAL-CHROME PASS
Production installer/registration: NOT IMPLEMENTED
AutoHotkey: NOT IMPLEMENTED
automatic paste: NOT IMPLEMENTED
```

## Probe Disposition

The developer-only M14-I.1.5 probe served its feasibility purpose. M14-I.5 removes its URL/hash gates, F8/F9 behavior, focused-extension control, content/service-worker/options integration, diagnostic output, message contracts, source, and probe-only tests. These historical procedures cannot be run from the final extension. This document retains the A1/A2/B evidence; no probe-specific deterministic PNG fixture remains in extension runtime.

## Preserved Boundaries

- Text delivery remains real-Chrome validated and unchanged, including clipboard preparation, trigger cleanup, copied notice, bold, italic, links, bullet lists, and numbered lists.
- Manual `Ctrl+V` remains accepted; automatic paste is not introduced.
- Decision 42 remains unchanged: 5 MiB encoded maximum; 8192 width/height; 16,777,216 pixels; 64 MiB decoded RGBA; two-surface/128 MiB conceptual working set; metadata-before-decode; post-decode validation; animated WebP rejection; genuine JPEG/WebP-to-PNG conversion; and no silent resizing/downsampling.
- Backup v5 and Dexie v5 remain current.
- Text/Image domains, `SnippetAsset`, metadata-only `{ kind, trigger, snippetId }` catalogs, authoritative service-worker planning, freshness checks, compare-and-swap cleanup, M13-B.1 publication barrier, Decisions 38/41/42, and M15 separation remain unchanged by Decision 43.
- M14-J remains `NOT STARTED` until Principal final M14-I review, the post-cleanup smoke test, and the M14-I checkpoint.
- Decision 40 remains separate future Workspace Shell work. M15 Context Images remain separate future AI input work with no Image Snippet bridge.

## Sequence

```text
M14-I.1.5.2 feasibility conclusion
→ M14-I.2 Windows Native Clipboard Companion Architecture / Decision 43
→ Principal approval
→ M14-I.3/M14-I.4 implementation
→ Image real-Chrome validation: PASS
→ M14-I.5 M14-I.1.4 and probe cleanup: COMPLETE
→ Principal final review and post-cleanup smoke test
→ M14-I checkpoint
→ M14-J destination validation
```
