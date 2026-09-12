import { Buffer } from 'node:buffer';
import { performance } from 'node:perf_hooks';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { summarizeSamples } from './m14-q-measurement.mjs';

// Existing development executable only; no registration, build, clipboard or input.
const executable = resolve(
  'native/windows-clipboard-companion/artifacts/development-host/publish/AI.SupportWorkspace.ClipboardCompanion.exe',
);
const configuration = JSON.parse(
  await readFile('config/native-clipboard-companion.development.json', 'utf8'),
);
const body = Buffer.from(
  '{"protocolVersion":1,"requestId":"0123456789abcdef0123456789abcdef","operation":"get-capabilities"}',
);
const header = Buffer.alloc(4);
header.writeUInt32LE(body.length);
const report = {
  managedAssemblySha256: createHash('sha256')
    .update(await readFile(executable.replace(/\.exe$/, '.dll')))
    .digest('hex'),
  executableSha256: createHash('sha256')
    .update(await readFile(executable))
    .digest('hex'),
  provenance:
    'Existing development publish; executable hash recorded, rebuild/registration not performed',
  interval:
    'Node spawn call through child close after one framed content-free get-capabilities response; OS caches not reset; no Chrome native-message transport',
  runs: [],
};
for (let i = 0; i < 35; i++) {
  const start = performance.now();
  const row = await new Promise((resolveResult) => {
    const child = spawn(
      executable,
      [configuration.extensionOrigin, '--parent-window=0'],
      { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] },
    );
    const chunks = [];
    let stderrBytes = 0;
    child.stdout.on('data', (chunk) => chunks.push(chunk));
    child.stderr.on('data', (chunk) => {
      stderrBytes += chunk.length;
    });
    child.on('error', (error) => resolveResult({ error: String(error) }));
    child.on('close', (code) => {
      const ms = performance.now() - start;
      const buffer = Buffer.concat(chunks);
      try {
        if (buffer.length < 4 || buffer.readUInt32LE() !== buffer.length - 4)
          throw new Error('Invalid response framing');
        const response = JSON.parse(buffer.subarray(4).toString());
        resolveResult({ ms, code, response, stderrBytes });
      } catch (error) {
        resolveResult({ ms, code, error: String(error), stderrBytes });
      }
    });
    child.stdin.end(Buffer.concat([header, body]));
  });
  report.runs.push({
    phase: i < 5 ? 'initial-exploratory-launch' : 'warm-os-cache-launch',
    ...row,
  });
}
report.summary = summarizeSamples(
  report.runs
    .slice(5)
    .filter((row) => row.code === 0 && !row.error)
    .map((row) => row.ms),
);
await mkdir('tests/performance/results', { recursive: true });
await writeFile(
  'tests/performance/results/m14-q-native.json',
  JSON.stringify(report, null, 2),
);
