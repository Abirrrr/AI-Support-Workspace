import { readFile, writeFile, readdir } from 'node:fs/promises';
import { summarizeSamples } from './m14-q-measurement.mjs';
import process from 'node:process';
const root = 'tests/performance/results';
const files = await readdir(root);
const read = async (name) =>
  JSON.parse(
    (await readFile(`${root}/${name}`, 'utf8')).replace(/^\uFEFF/, ''),
  );
const stats = (values) => {
  const summary = summarizeSamples(values);
  delete summary.samplesMs;
  return summary;
};
const summary = {};
for (const file of files.filter((f) =>
  /^m14-q-browser-(profile|lifecycle-resume|lifecycle-control)\.json$/.test(f),
)) {
  const report = await read(file);
  summary[file] = {
    failures: report.failures,
    profile: report.tiers?.map((tier) => ({
      tier: tier.tier,
      queries: ['common', 'rareterm', 'zzznomatch'].map((query) => {
        const operations = tier.operations.filter((op) => op.query === query);
        return {
          query,
          interval: stats(operations.map((op) => op.ms)),
          task: stats(operations.map((op) => op.deltaMs.TaskDuration)),
          script: stats(operations.map((op) => op.deltaMs.ScriptDuration)),
          layout: stats(operations.map((op) => op.deltaMs.LayoutDuration)),
        };
      }),
    })),
    lifecycle: report.lifecycle?.map((row) => ({
      cycle: row.cycle ?? 'after-unmount',
      liveElements: row.metrics.liveElements,
      nodes: row.metrics.nodes,
      listeners: row.metrics.jsEventListeners,
      heapBytes: row.metrics.JSHeapUsedSize,
      urls: row.urls,
    })),
    idle: report.typing
      ?.filter((row) => row.idleSeconds)
      .map((row) => ({
        extension: row.extension,
        intervalSeconds: row.idleSeconds,
        rendererTaskMs:
          (row.after.TaskDuration - row.before.TaskDuration) * 1000,
      })),
    typing: report.typing
      ?.filter((row) => row.protocolRoundtrip)
      .map((row) => ({
        extension: row.extension,
        target: row.target,
        text: row.text,
        ...stats(row.protocolRoundtrip.samplesMs),
      })),
    reopen: report.reopenCycles
      ? stats(report.reopenCycles.samplesMs)
      : undefined,
    shared: report.shared?.map((row) => ({
      tabs: row.eligibleTabs,
      entries: row.actualEntries,
      catalog: stats(row.catalogIpc.samplesMs),
      reload: stats(row.concurrentReloadsProtocol.samplesMs),
      overlap: stats(row.overlappingSaveTypingProtocol.samplesMs),
    })),
    workerRecovery: report.workerRecovery
      ? {
          ...stats(report.workerRecovery.map((row) => row.ms)),
          distinctEpochs: new Set(report.workerRecovery.map((row) => row.epoch))
            .size,
          entries: report.workerRecovery.map((row) => row.entries),
        }
      : undefined,
  };
}
if (files.includes('m14-q-storage-near.json')) {
  const report = await read('m14-q-storage-near.json');
  const row = report.sessions[0];
  summary.near = {
    failures: report.failures,
    fixture: row.setup?.fixture,
    frameGaps: row.frameGaps ? stats(row.frameGaps) : undefined,
    stageBoundaryHeapBytes: row.memorySnapshots?.map(
      (snapshot) =>
        snapshot.metrics.find((metric) => metric.name === 'JSHeapUsedSize')
          .value,
    ),
  };
}
await writeFile(
  `${root}/m14-q-diagnostics-summary.json`,
  JSON.stringify(summary, null, 2) + '\n',
);
process.stdout.write('Wrote phase-separated diagnostic summary.\n');
