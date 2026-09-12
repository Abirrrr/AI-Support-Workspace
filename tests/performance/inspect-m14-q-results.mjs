import { readFile } from 'node:fs/promises';
import process from 'node:process';
// Read-only compact view; the JSON evidence is never rewritten.
let report = JSON.parse(
  (await readFile(process.argv[2], 'utf8')).replace(/^\uFEFF/, ''),
);
if (process.argv[3])
  for (const key of process.argv[3].split('.')) report = report[key];
function compact(value, key = '') {
  if (
    ['samplesMs', 'samples', 'runs', 'frameGaps', 'memorySnapshots'].includes(
      key,
    ) &&
    Array.isArray(value)
  )
    return { retainedRawCount: value.length };
  if (Array.isArray(value)) return value.map((v) => compact(v));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, compact(v, k)]),
    );
  return value;
}
process.stdout.write(JSON.stringify(compact(report), null, 2) + '\n');
