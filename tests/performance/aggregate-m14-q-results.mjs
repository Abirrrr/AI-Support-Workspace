import { readFile, writeFile, readdir } from 'node:fs/promises';
import { summarizeSamples } from './m14-q-measurement.mjs';
import process from 'node:process';

const root = 'tests/performance/results';
const read = async (name) =>
  JSON.parse(
    (await readFile(`${root}/${name}`, 'utf8')).replace(/^\uFEFF/, ''),
  );
const number = (value) =>
  value === undefined ? '—' : Number(value.toFixed(3));
const cells = (value) =>
  [
    value.n,
    number(value.medianMs),
    number(value.p95Ms),
    number(value.maxMs),
  ].join(' | ');
const lines = [
  '# M14-Q raw evidence aggregation',
  '',
  'Generated from retained JSON; milliseconds. Nearest-rank median/p95; p95 omitted below 20 samples. Each row stays in its own batch/phase. No failed timing is converted to zero. See the audit report for timing boundaries and exclusions.',
  '',
];
const section = (title, headers) => {
  lines.push(
    `## ${title}`,
    '',
    `| ${headers} |`,
    `| ${headers
      .split(' | ')
      .map(() => '---')
      .join(' | ')} |`,
  );
};
const files = await readdir(root);
section(
  'Storage operations',
  'Evidence / tier / reset | Operation | Phase | n | Median | p95 | Maximum | Failures',
);
for (const file of files.filter((f) => /^m14-q-storage-.*\.json$/.test(f))) {
  const report = await read(file);
  for (const session of report.sessions) {
    for (const [name, result] of Object.entries(session.measurements)) {
      if (result.firstUse?.length)
        lines.push(
          `| ${file} / ${session.tier} / ${session.reset} | ${name} | first invocation | ${cells(summarizeSamples(result.firstUse.filter((x) => !x.error).map((x) => x.ms)))} | ${result.firstUse.filter((x) => x.error).length} |`,
        );
      lines.push(
        `| ${file} / ${session.tier} / ${session.reset} | ${name} | ${session.reset ? 'independent reset invocation' : 'measured after declared warmups'} | ${cells(result)} | ${result.failures.length} |`,
      );
    }
    if (session.error)
      lines.push(
        `| ${file} / ${session.tier} / ${session.reset} | setup/later failure: ${session.error.replaceAll('|', '/')} | unavailable | 0 | — | — | — | 1 |`,
      );
  }
}
lines.push('');
section('Delivery A/B', 'Evidence | Path | Phase | n | Median | p95 | Maximum');
for (const file of ['m14-q-delivery-a.json', 'm14-q-delivery-b.json']) {
  const report = await read(file);
  function visit(value, path) {
    if (value && typeof value === 'object' && 'coldRawMs' in value) {
      const cold = report.runs.map(
        (run) => path.reduce((v, key) => v[key], run.result).coldRawMs,
      );
      lines.push(
        `| ${file} | ${path.join('/')} | five fresh-context first calls | ${cells(summarizeSamples(cold))} |`,
      );
      lines.push(
        `| ${file} | ${path.join('/')} | warm first context | ${cells(value)} |`,
      );
    } else if (value && typeof value === 'object')
      for (const [key, child] of Object.entries(value))
        visit(child, [...path, key]);
  }
  visit(report.runs[0].result, []);
}
lines.push('');
section(
  'Browser UI',
  'Evidence / tier | Operation | n | Median | p95 | Maximum',
);
for (const file of files.filter((f) => /^m14-q-browser-.*\.json$/.test(f))) {
  const report = await read(file);
  for (const tier of report.tiers ?? []) {
    for (const [name, value] of Object.entries(tier)) {
      if (
        [
          'coldOptions',
          'coldPanel',
          'launches',
          'initialEmptyOptions',
        ].includes(name)
      )
        lines.push(
          `| ${file} / ${tier.tier} | ${name} | ${cells(summarizeSamples(value))} |`,
        );
      else if (value && typeof value === 'object' && 'n' in value)
        lines.push(`| ${file} / ${tier.tier} | ${name} | ${cells(value)} |`);
      else if (name === 'confirmedDeleteMs')
        lines.push(
          `| ${file} / ${tier.tier} | ${name} (one event) | ${cells(summarizeSamples([value]))} |`,
        );
    }
  }
}
lines.push('');
section(
  'Controlled trigger handler, pooled five contexts',
  'Catalog / mode / editor / scenario | Phase / stage | n | Median | p95 | Maximum | Delivery calls',
);
const trigger = await read('m14-q-trigger.json');
for (let i = 0; i < trigger.runs[0].result.length; i++) {
  const scenario = trigger.runs[0].result[i];
  const runs = trigger.runs.flatMap((run) => run.result[i].runs);
  for (const phase of ['first-use', 'warm'])
    for (const stage of ['synchronousMs', 'totalMs']) {
      const selected = runs.filter((run) => run.phase === phase);
      lines.push(
        `| ${scenario.count} / ${scenario.mode} / ${scenario.kind} / ${scenario.scenario} | ${phase} / ${stage} | ${cells(summarizeSamples(selected.map((run) => run[stage])))} | ${selected.reduce((sum, run) => sum + run.calls, 0)} |`,
      );
    }
}
lines.push('');
await writeFile(`${root}/m14-q-aggregate-final.md`, lines.join('\n'));
process.stdout.write(
  `Wrote ${lines.length} lines of phase-separated aggregation.\n`,
);
