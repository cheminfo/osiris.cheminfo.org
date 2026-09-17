import { expect, test } from 'vitest';

import { resetPredictors } from '../core/index.ts';
import type { PredictionOutcome } from '../pool/index.ts';
import { createPredictionPool } from '../pool/index.ts';
import { isPredictRequest } from '../worker/protocol.ts';
import { runPredictionJob } from '../worker/runPredictionJob.ts';

import { osirisResources } from './osirisResources.ts';

const resources = osirisResources();

test('a request the worker does not handle is recognised as such', () => {
  expect(
    isPredictRequest({ kind: 'properties', resources, key: 'a', idCode: 'x' }),
  ).toBe(true);
  expect(
    isPredictRequest({ kind: 'riskDetail', resources, idCode: 'x', risk: 'a' }),
  ).toBe(true);
  expect(isPredictRequest({ kind: 'properties', resources, idCode: 'x' })).toBe(
    false,
  );
  expect(isPredictRequest({ kind: 'nonsense', resources, idCode: 'x' })).toBe(
    false,
  );
  expect(isPredictRequest({ kind: 'properties', key: 'a', idCode: 'x' })).toBe(
    false,
  );
  expect(isPredictRequest(null)).toBe(false);
  expect(isPredictRequest('properties')).toBe(false);
});

test('the pool predicts a real set end to end, streaming the answers', async () => {
  const seen = new Map<string, PredictionOutcome>();
  const pool = createPredictionPool({
    resources,
    size: 1,
    onResult: (outcome) => seen.set(outcome.key, outcome),
  });

  pool.submit([
    { key: 'first', idCode: 'gFp@DiTt@@@', label: 'Benzene' },
    { key: 'second', idCode: 'eF@Hp@' },
    { key: 'third', idCode: '!!!bad!!!' },
  ]);

  await new Promise<void>((resolve) => {
    const wait = setInterval(() => {
      if (pool.progress.running) return;
      clearInterval(wait);
      resolve();
    }, 20);
  });

  expect(pool.progress).toStrictEqual({
    done: 3,
    total: 3,
    pending: 0,
    running: false,
  });

  const benzene = seen.get('first');
  expect(benzene?.ok).toBe(true);
  expect(benzene?.ok === true && benzene.properties.label).toBe('Benzene');
  expect(benzene?.ok === true && benzene.properties.logP?.toFixed(2)).toBe(
    '1.66',
  );
  expect(benzene?.ok === true && benzene.properties.drugScore?.toFixed(2)).toBe(
    '0.06',
  );

  const ethane = seen.get('second');
  expect(ethane?.ok === true && ethane.properties.molecularFormula).toBe(
    'C2H6',
  );
  expect(ethane?.ok === true && ethane.properties.risks.mutagenic).toBe('none');

  expect(seen.get('third')?.ok).toBe(false);
  pool.terminate();
  // Three real predictions plus the worker's start-up check, on a machine that
  // is also running the other test files: comfortably past the default budget.
}, 30_000);

test('the worker job answers a risk detail with the offending fragment', async () => {
  const answer = await runPredictionJob({
    kind: 'riskDetail',
    resources,
    idCode: 'dg}@@@mIe]e^ftx@H@H@@',
    risk: 'mutagenic',
  });

  expect(answer.kind).toBe('riskDetail');
  expect(
    answer.kind === 'riskDetail' && answer.detail.findings[0]?.idCode,
  ).toBe('dk^@@@RYWYVftx@H@@@H');
});

test('resources that hold nothing are answered as unavailable, not as a failure', async () => {
  // A rejection would be indistinguishable from one unreadable structure. This
  // is every structure, so it travels as an answer of its own.
  resetPredictors();
  const answer = await runPredictionJob({
    kind: 'properties',
    resources: 'not a url',
    key: 'a',
    idCode: 'gFp@DiTt@@@',
  });
  expect(answer.kind).toBe('unavailable');
});
