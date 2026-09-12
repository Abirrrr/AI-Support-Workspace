import { performance } from 'node:perf_hooks';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, access } from 'node:fs/promises';
import process from 'node:process';

// Fixed local validation commands only; no installation, registration or Git writes.
const solution =
  'native/windows-clipboard-companion/AI.SupportWorkspace.ClipboardCompanion.sln';
const commands = {
  lint: ['pnpm.cmd', ['lint']],
  'format-base': ['pnpm.cmd', ['format', '--check']],
  format: [
    'pnpm.cmd',
    [
      'format',
      '--check',
      '--ignore-path',
      '.gitignore',
      '--ignore-path',
      '.prettierignore',
      '--ignore-path',
      'tests/performance/.prettierignore',
    ],
  ],
  typecheck: ['pnpm.cmd', ['typecheck']],
  test: ['pnpm.cmd', ['test']],
  e2e: ['pnpm.cmd', ['test:e2e']],
  build: ['pnpm.cmd', ['build']],
  'build-native-dev': ['pnpm.cmd', ['build:native-dev']],
  'native-restore': ['dotnet', ['restore', solution]],
  'native-build': [
    'dotnet',
    ['build', solution, '-c', 'Release', '--no-restore'],
  ],
  'native-test': ['dotnet', ['test', solution, '-c', 'Release', '--no-build']],
  'diff-check': ['git', ['diff', '--check']],
  fsck: ['git', ['fsck', '--full']],
  integrity: ['node', ['tests/performance/verify-m14-q-measurement.mjs']],
  evidence: ['node', ['tests/performance/verify-m14-q-evidence.mjs']],
  'browser-mixed': [
    'node',
    ['tests/performance/run-m14-q-browser.mjs', 'mixed'],
  ],
  'browser-image-edit': [
    'node',
    ['tests/performance/run-m14-q-browser.mjs', 'image-edit'],
  ],
};
const name = process.argv[2];
const command = commands[name];
if (!command) throw new Error('Unknown fixed validation command');
const label = process.argv[3] ?? name;
if (!/^[a-z0-9-]+$/.test(label)) throw new Error('Invalid output label');
const root = 'tests/performance/results/resume-command-evidence';
await mkdir(root, { recursive: true });
const path = `${root}/${label}.txt`;
try {
  await access(path);
  throw new Error(`Refusing to overwrite ${path}`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const started = new Date().toISOString();
const start = performance.now();
const [executable, args] = command;
let output = `Command: ${executable} ${args.join(' ')}\nStarted UTC: ${started}\nOLLAMA_LIVE_MODEL empty in this child process.\n`;
const child = spawn(executable, args, {
  shell: executable.endsWith('.cmd'),
  windowsHide: true,
  env: { ...process.env, OLLAMA_LIVE_MODEL: '' },
});
for (const stream of [child.stdout, child.stderr])
  stream.on('data', (bytes) => {
    const text = bytes.toString();
    output += text;
    process.stdout.write(text);
  });
const exitCode = await new Promise((resolve, reject) => {
  child.on('error', reject);
  child.on('close', resolve);
});
const result = {
  command: `${executable} ${args.join(' ')}`,
  startedUtc: started,
  finishedUtc: new Date().toISOString(),
  elapsedSeconds: (performance.now() - start) / 1000,
  exitCode,
  liveProviderEnabled: false,
};
await writeFile(path, output);
await writeFile(
  `${root}/${label}.json`,
  JSON.stringify(result, null, 2) + '\n',
);
process.stdout.write(JSON.stringify(result) + '\n');
process.exitCode = exitCode ?? 1;
