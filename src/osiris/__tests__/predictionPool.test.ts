import { expect, test, vi } from 'vitest';

import type { OsirisProperties } from '../core/index.ts';
import type { PredictionOutcome, PredictionProgress } from '../pool/index.ts';
import {
  MAX_POOL_SIZE,
  createPredictionPool,
  createPredictionQueue,
  predictionPoolSize,
} from '../pool/index.ts';
import type { PredictRequest, PredictResponse } from '../worker/protocol.ts';

/** A job that answers instantly, so the pool is tested and not OpenChemLib. */
function fakeJob(
  order: string[] = [],
): (request: PredictRequest) => Promise<PredictResponse> {
  return async (request) => {
    if (request.kind !== 'properties') {
      return {
        kind: 'riskDetail',
        detail: { risk: 'mutagenic', findings: [] },
      };
    }
    order.push(request.key);
    if (request.idCode === 'bad') throw new Error('This structure is bad.');
    return {
      kind: 'properties',
      key: request.key,
      properties: { idCode: request.idCode } as OsirisProperties,
    };
  };
}

function inputs(count: number) {
  const list = [];
  for (let index = 0; index < count; index++) {
    list.push({ key: `row-${index}`, idCode: `code-${index}` });
  }
  return list;
}

async function settle(): Promise<void> {
  for (let turn = 0; turn < 40; turn++) {
    // eslint-disable-next-line no-await-in-loop -- one macrotask per turn is the point
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
}

test('the pool is one worker per core, minus one, clamped to 1 to 8', () => {
  expect(predictionPoolSize(4)).toBe(4);
  expect(predictionPoolSize(0)).toBe(1);
  expect(predictionPoolSize(-3)).toBe(1);
  expect(predictionPoolSize(64)).toBe(MAX_POOL_SIZE);
  expect(predictionPoolSize(2.9)).toBe(2);
});

test('results stream back one at a time, and progress counts them', async () => {
  const seen: PredictionOutcome[] = [];
  const steps: PredictionProgress[] = [];
  const pool = createPredictionPool({
    resources: 'unused',
    size: 2,
    runInProcess: fakeJob(),
    onResult: (outcome) => seen.push(outcome),
    onProgress: (progress) => steps.push({ ...progress }),
  });

  pool.submit(inputs(6));
  expect(pool.progress).toStrictEqual({
    done: 0,
    total: 6,
    pending: 6,
    running: true,
  });

  await settle();

  expect(seen).toHaveLength(6);
  expect(seen.every((outcome) => outcome.ok)).toBe(true);
  expect(pool.progress).toStrictEqual({
    done: 6,
    total: 6,
    pending: 0,
    running: false,
  });
  // Every molecule was reported as it finished, never in one batch at the end.
  expect(steps.map((step) => step.done)).toContain(1);
  pool.terminate();
});

test('a molecule that cannot be read fails alone, and the run carries on', async () => {
  const seen: PredictionOutcome[] = [];
  const pool = createPredictionPool({
    resources: 'unused',
    size: 1,
    runInProcess: fakeJob(),
    onResult: (outcome) => seen.push(outcome),
  });

  pool.submit([
    { key: 'a', idCode: 'good' },
    { key: 'b', idCode: 'bad' },
    { key: 'c', idCode: 'good' },
  ]);
  await settle();

  expect(seen).toHaveLength(3);
  expect(seen[1]).toStrictEqual({
    key: 'b',
    ok: false,
    message: 'This structure is bad.',
  });
  expect(pool.progress.done).toBe(3);
  pool.terminate();
});

test('the rows the reader can see are computed first', async () => {
  const order: string[] = [];
  const pool = createPredictionPool({
    resources: 'unused',
    size: 1,
    runInProcess: fakeJob(order),
  });

  pool.submit(inputs(5));
  pool.prioritize(['row-4', 'row-3']);
  await settle();

  // row-0 was already dispatched when the reader scrolled; the rest follow the
  // wanted list, then the reading order.
  expect(order).toStrictEqual(['row-0', 'row-4', 'row-3', 'row-1', 'row-2']);
  pool.terminate();
});

test('cancel drops what is queued and stops reporting', async () => {
  const seen: PredictionOutcome[] = [];
  const pool = createPredictionPool({
    resources: 'unused',
    size: 1,
    runInProcess: fakeJob(),
    onResult: (outcome) => seen.push(outcome),
  });

  pool.submit(inputs(50));
  pool.cancel();
  await settle();

  expect(pool.progress.running).toBe(false);
  expect(pool.progress.pending).toBe(0);
  // At most the one molecule already in flight, whose answer is thrown away.
  expect(seen).toHaveLength(0);
  pool.terminate();
});

test('a molecule already answered is never asked for twice', async () => {
  const order: string[] = [];
  const pool = createPredictionPool({
    resources: 'unused',
    size: 1,
    runInProcess: fakeJob(order),
  });

  pool.submit(inputs(3));
  pool.submit(inputs(3));
  await settle();

  expect(order).toStrictEqual(['row-0', 'row-1', 'row-2']);
  expect(pool.progress.total).toBe(3);
  pool.terminate();
});

test('resources that did not load stop the run and say so once', async () => {
  const unavailable = vi.fn();
  const seen: PredictionOutcome[] = [];
  const pool = createPredictionPool({
    resources: 'unused',
    size: 2,
    runInProcess: async () => ({
      kind: 'unavailable',
      message: 'The prediction tables did not load.',
    }),
    onResult: (outcome) => seen.push(outcome),
    onUnavailable: unavailable,
  });

  pool.submit(inputs(10));
  await settle();

  expect(unavailable).toHaveBeenCalledExactlyOnceWith(
    'The prediction tables did not load.',
  );
  // Nothing is reported as a result: every answer would have been "unknown".
  expect(seen).toHaveLength(0);
  expect(pool.progress.running).toBe(false);

  // And nothing more is dispatched.
  pool.submit(inputs(3));
  await settle();
  expect(unavailable).toHaveBeenCalledOnce();
  pool.terminate();
});

test('a risk detail jumps the queue', async () => {
  const pool = createPredictionPool({
    resources: 'unused',
    size: 1,
    runInProcess: fakeJob(),
  });
  pool.submit(inputs(20));
  const detail = await pool.riskDetail('gFp@DiTt@@@', 'mutagenic');
  expect(detail).toStrictEqual({ risk: 'mutagenic', findings: [] });
  pool.terminate();
});

test('the queue keeps arrival order until a wanted list says otherwise', () => {
  const queue = createPredictionQueue();
  expect(queue.add({ key: 'a', idCode: 'a' })).toBe(true);
  expect(queue.add({ key: 'a', idCode: 'a' })).toBe(false);
  queue.add({ key: 'b', idCode: 'b' });
  queue.add({ key: 'c', idCode: 'c' });
  expect(queue.size).toBe(3);
  expect(queue.has('b')).toBe(true);

  queue.prioritize(['gone', 'c']);
  expect(queue.take()?.key).toBe('c');
  expect(queue.take()?.key).toBe('a');
  expect(queue.take()?.key).toBe('b');
  expect(queue.take()).toBeUndefined();

  queue.add({ key: 'd', idCode: 'd' });
  queue.clear();
  expect(queue.size).toBe(0);
});
