/**
 * What cancelling a run must and must not take with it.
 *
 * The worker each slot holds cannot be interrupted, so a cancel abandons its
 * answer rather than stopping it. Two things follow, and both are pinned here:
 * work submitted in the same turn as the cancel still has to be dispatched,
 * and a risk explanation the reader clicked for is not part of the set being
 * cancelled.
 */

import { expect, test } from 'vitest';

import type { OsirisProperties } from '../core/index.ts';
import { createPredictionPool } from '../pool/index.ts';
import type { PredictRequest, PredictResponse } from '../worker/protocol.ts';

/**
 * A job that answers instantly, except for the keys a cancel is meant to
 * abandon, which never come back — the worker still chewing on its molecule.
 * @param order - Filled with every key the runner was asked for.
 * @returns The runner.
 */
function stuckJob(
  order: string[],
): (request: PredictRequest) => Promise<PredictResponse> {
  return async (request) => {
    if (request.kind !== 'properties') {
      return {
        kind: 'riskDetail',
        detail: { risk: request.risk, findings: [] },
      };
    }
    order.push(request.key);
    if (request.key.startsWith('stuck')) {
      return new Promise<PredictResponse>(() => {
        // The molecule already in flight is never answered.
      });
    }
    return {
      kind: 'properties',
      key: request.key,
      properties: { idCode: request.idCode } as OsirisProperties,
    };
  };
}

async function settle(): Promise<void> {
  for (let turn = 0; turn < 10; turn++) {
    // eslint-disable-next-line no-await-in-loop -- one macrotask per turn is the point
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
}

test('molecules submitted in the same turn as a cancel are still dispatched', async () => {
  const order: string[] = [];
  const pool = createPredictionPool({
    resources: 'unused',
    size: 2,
    runInProcess: stuckJob(order),
  });

  pool.submit([
    { key: 'stuck-0', idCode: 'a' },
    { key: 'stuck-1', idCode: 'b' },
    { key: 'stuck-2', idCode: 'c' },
  ]);

  // The same synchronous turn: the abandoned jobs settle a microtask later, so
  // every slot still reads as busy while these two are queued.
  pool.cancel();
  pool.submit([
    { key: 'd', idCode: 'd' },
    { key: 'e', idCode: 'e' },
  ]);

  await settle();

  expect(order).toStrictEqual(['stuck-0', 'stuck-1', 'd', 'e']);
  expect(pool.progress).toStrictEqual({
    done: 2,
    total: 2,
    pending: 0,
    running: false,
  });
  pool.terminate();
});

test('cancelling the set keeps the risk explanation the reader asked for', async () => {
  const order: string[] = [];
  const pool = createPredictionPool({
    resources: 'unused',
    size: 1,
    runInProcess: stuckJob(order),
  });

  pool.submit([{ key: 'stuck-0', idCode: 'a' }]);
  const detail = pool.riskDetail('gFp@DiTt@@@', 'mutagenic');
  pool.cancel();

  await expect(detail).resolves.toStrictEqual({
    risk: 'mutagenic',
    findings: [],
  });
  pool.terminate();
});

test('an explanation that cannot be asked for again says so in plain words', async () => {
  const pool = createPredictionPool({
    resources: 'unused',
    size: 1,
    runInProcess: stuckJob([]),
  });

  const detail = pool.riskDetail('gFp@DiTt@@@', 'mutagenic');
  pool.terminate();

  await expect(detail).rejects.toThrow(
    'That explanation was dropped when the run stopped. Close the risk square and open it again.',
  );
});
