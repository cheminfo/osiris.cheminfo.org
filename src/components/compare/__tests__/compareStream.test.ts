/**
 * The whole point of the comparison page, without React: a row exists before
 * its numbers do, fills in when its worker answers, and a brush then keeps it
 * or does not.
 *
 * The pool is real — it is the thing that streams — and only the prediction
 * itself is faked, so what is under test is the page's arithmetic over answers
 * arriving one at a time rather than OpenChemLib.
 */

import { parallelIncludedMask, parallelKeptCount } from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import type {
  OsirisProperties,
  PredictRequest,
  PredictResponse,
  PredictionOutcome,
} from '../../../osiris/index.ts';
import { createPredictionPool } from '../../../osiris/index.ts';
import { compareAxes } from '../compareAxes.ts';
import { cellText, keptIndices, rowStatusOf } from '../compareRows.ts';

import { properties, row } from './fixtures.ts';

/** What each molecule comes back as, so the answers are worth asserting on. */
const ANSWERS: Record<string, Partial<OsirisProperties>> = {
  'id-r0': { logP: 1.66, label: 'benzene' },
  'id-r1': { logP: 4.2, label: 'heavy' },
};

async function settle(): Promise<void> {
  for (let turn = 0; turn < 20; turn++) {
    // eslint-disable-next-line no-await-in-loop -- one macrotask per turn is the point
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
}

function fakeJob(request: PredictRequest): Promise<PredictResponse> {
  if (request.kind !== 'properties') {
    return Promise.resolve({
      kind: 'riskDetail',
      detail: { risk: 'mutagenic', findings: [] },
    });
  }
  return Promise.resolve({
    kind: 'properties',
    key: request.key,
    properties: properties({
      idCode: request.idCode,
      ...ANSWERS[request.idCode],
    }),
  });
}

test('a row is drawn pending, fills in as its worker answers, and is then brushable', async () => {
  const rows = [row({ key: 'r0' }), row({ key: 'r1' })];
  const results = new Map<string, OsirisProperties>();
  const failures = new Map<string, string>();

  // Nothing predicted yet: the row stands, with no value on any axis.
  const waiting = compareAxes(rows, results, ['logP', 'molecularWeight']);
  expect(Array.from(waiting[0]?.values ?? [])).toStrictEqual([
    Number.NaN,
    Number.NaN,
  ]);
  expect(rowStatusOf('r0', results, failures)).toBe('pending');
  expect(cellText(undefined, 'logP', 'pending')).toBe('…');
  // With no brush, a row nobody has predicted is still part of the set.
  expect(
    parallelKeptCount(parallelIncludedMask(waiting, {}, rows.length)),
  ).toBe(2);

  const pool = createPredictionPool({
    resources: 'unused',
    size: 1,
    runInProcess: fakeJob,
    onResult: (outcome: PredictionOutcome) => {
      if (outcome.ok) results.set(outcome.key, outcome.properties);
      else failures.set(outcome.key, outcome.message);
    },
  });
  pool.submit(rows.map((entry) => ({ key: entry.key, idCode: entry.idCode })));
  await settle();
  pool.terminate();

  expect(pool.progress.done).toBe(2);
  expect(rowStatusOf('r0', results, failures)).toBe('ready');
  expect(cellText(results.get('r0'), 'logP', 'ready')).toBe('1.66');

  const axes = compareAxes(rows, results, ['logP', 'molecularWeight']);
  expect(Array.from(axes[0]?.values ?? [])).toStrictEqual([1.66, 4.2]);

  // Brushing the low half of cLogP keeps the first molecule and drops the other.
  const included = parallelIncludedMask(axes, { logP: [0, 2] }, rows.length);
  expect(parallelKeptCount(included)).toBe(1);
  expect(keptIndices(included, rows.length)).toStrictEqual([0]);
});

test('a brushed axis cannot keep a molecule nobody has predicted yet', async () => {
  const rows = [row({ key: 'r0' }), row({ key: 'r1' })];
  const results = new Map<string, OsirisProperties>();
  const pool = createPredictionPool({
    resources: 'unused',
    size: 1,
    runInProcess: (request) =>
      request.kind === 'properties' && request.key === 'r1'
        ? Promise.reject(new Error('This structure could not be read.'))
        : fakeJob(request),
    onResult: (outcome: PredictionOutcome) => {
      if (outcome.ok) results.set(outcome.key, outcome.properties);
    },
  });
  pool.submit(rows.map((entry) => ({ key: entry.key, idCode: entry.idCode })));
  await settle();
  pool.terminate();

  const axes = compareAxes(rows, results, ['logP', 'molecularWeight']);
  const included = parallelIncludedMask(axes, { logP: [-10, 10] }, rows.length);

  expect(results.has('r1')).toBe(false);
  expect(keptIndices(included, rows.length)).toStrictEqual([0]);
});
