# M14-Q command logging limitations

The original command logs remain unchanged. Some early PowerShell logs mix UTF-8 headers with UTF-16 appended stdout; some pnpm invocations saved only command headers plus separate exit/time metadata.

During `storage-near` and `storage-mapping` on 2026-09-12 at 09:09 UTC, PowerShell `Add-Content` reported that the respective `.txt` log was being used by another process. The terminal still printed the batch-completed message and exit/time JSON. Each measurement result JSON was saved completely: the near batch has three successful samples for each of six operations; mapping has one first invocation and 30 successful measured samples. These are logging failures, not successful full-output capture and not product/measurement failures. No measurement was repeated to repair a log.

The new fixed-command Node logger was successfully exercised by focused integrity verification and typecheck. It preserves stdout/stderr after execution; full validation uses that logger. Its pnpm shell invocation may emit Node DEP0190; arguments are fixed local command constants, not user-provided shell text. This warning is preserved and does not change command exit results.
