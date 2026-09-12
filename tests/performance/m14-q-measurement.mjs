/* global requestAnimationFrame, window, document, performance */
// Audit-only helpers, never imported by production entry points.
export function summarizeSamples(samples) {
  if (!samples.every((value) => Number.isFinite(value) && value >= 0)) {
    throw new TypeError('Timing samples must be finite nonnegative numbers.');
  }
  const base = {
    status: samples.length ? 'measured' : 'not-measured',
    n: samples.length,
    samplesMs: [...samples],
  };
  if (!samples.length) return base;
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    ...base,
    minMs: sorted[0],
    medianMs: sorted[Math.ceil(sorted.length / 2) - 1],
    meanMs: sorted.reduce((a, b) => a + b, 0) / sorted.length,
    maxMs: sorted.at(-1),
    ...(samples.length >= 20
      ? { p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1] }
      : {}),
  };
}

// Runs inside the disposable browser page. Reset and layout settling are untimed.
export async function measureScroll() {
  const frame = () => new Promise(requestAnimationFrame);
  window.scrollTo({ top: 0, behavior: 'instant' });
  await frame();
  await frame();
  const startY = window.scrollY;
  const targetY = Math.min(
    600,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  if (startY !== 0 || targetY <= 0)
    return {
      status: 'not-measured',
      reason: 'No verified scrollable range or reset failed',
      startY,
      targetY,
    };
  const start = performance.now();
  window.scrollTo({ top: targetY, behavior: 'instant' });
  await frame();
  await frame();
  const endY = window.scrollY;
  const ms = performance.now() - start;
  if (Math.abs(endY - targetY) > 1 || endY <= startY)
    return {
      status: 'not-measured',
      reason: 'Intended movement not verified',
      startY,
      targetY,
      endY,
    };
  return { status: 'measured', ms, startY, targetY, endY };
}
