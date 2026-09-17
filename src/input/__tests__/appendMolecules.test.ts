import { Molecule } from 'openchemlib';
import { expect, test } from 'vitest';

import { properties } from '../../components/compare/__tests__/fixtures.ts';
import { removeRow } from '../../components/compare/compareRows.ts';
import type {
  OsirisProperties,
  PredictRequest,
  PredictResponse,
} from '../../osiris/index.ts';
import { createPredictionPool } from '../../osiris/index.ts';
import { appendMolecules } from '../appendMolecules.ts';
import { readMolecules } from '../readMolecules.ts';
import type { MoleculeRow } from '../types.ts';

/** Caffeine, which shares no formula with anything else read here. */
const CAFFEINE = 'Cn1cnc2c1c(=O)n(C)c(=O)n2C';

async function rowsOf(text: string): Promise<MoleculeRow[]> {
  const { molecules } = await readMolecules(text);
  return molecules;
}

/**
 * Run the real pool over a set, with only the prediction itself faked: what is
 * under test is which row each answer is filed under.
 */
async function predict(
  rows: readonly MoleculeRow[],
): Promise<Map<string, OsirisProperties>> {
  const results = new Map<string, OsirisProperties>();
  const pool = createPredictionPool({
    resources: 'unused',
    size: 1,
    runInProcess: (request: PredictRequest) =>
      Promise.resolve(fakeAnswer(request)),
    onResult: (outcome) => {
      if (outcome.ok) results.set(outcome.key, outcome.properties);
    },
  });
  pool.submit(rows.map((entry) => ({ key: entry.key, idCode: entry.idCode })));
  for (let turn = 0; turn < 20; turn++) {
    // eslint-disable-next-line no-await-in-loop -- one macrotask per turn is the point
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
  pool.terminate();
  return results;
}

function fakeAnswer(request: PredictRequest): PredictResponse {
  if (request.kind !== 'properties') {
    return { kind: 'riskDetail', detail: { risk: 'mutagenic', findings: [] } };
  }
  const molecule = Molecule.fromIDCode(request.idCode);
  return {
    kind: 'properties',
    key: request.key,
    properties: properties({
      idCode: request.idCode,
      molecularFormula: molecule.getMolecularFormula().formula,
    }),
  };
}

test('added rows continue the keys the set already handed out', async () => {
  const first = await rowsOf('CCO ethanol\nCC ethane');
  const second = await rowsOf('CCC propane');
  const { molecules, added } = appendMolecules(first, second);
  expect(added).toBe(1);
  expect(molecules.map((row) => row.key)).toStrictEqual(['r0', 'r1', 'r2']);
  expect(molecules.map((row) => row.label)).toStrictEqual([
    'ethanol',
    'ethane',
    'propane',
  ]);
});

test('a structure already in the set is added again, marked as the repeat', async () => {
  const first = await rowsOf('CCO ethanol');
  const second = await rowsOf('CCO alcohol');
  const { molecules, duplicates } = appendMolecules(first, second);
  expect(duplicates).toBe(1);
  expect(molecules).toHaveLength(2);
  expect(molecules[1]?.label).toBe('alcohol');
  expect(molecules[1]?.duplicateOf).toBe('r0');
});

test('a repeat of a repeat points at the first row, not at the second', async () => {
  const set = await rowsOf('CCO one\nCCO two');
  const { molecules } = appendMolecules(set, await rowsOf('CCO three'));
  expect(molecules.map((row) => row.duplicateOf)).toStrictEqual([
    null,
    'r0',
    'r0',
  ]);
});

test('the set stops at its cap and says the rest was left out', async () => {
  const set = await rowsOf('CCO\nCC');
  const result = appendMolecules(set, await rowsOf('CCC\nCCCC'), {
    maxMolecules: 3,
  });
  expect(result.molecules).toHaveLength(3);
  expect(result.added).toBe(1);
  expect(result.truncated).toBe(true);
});

test('adding nothing changes nothing', async () => {
  const set = await rowsOf('CCO ethanol');
  const result = appendMolecules(set, []);
  expect(result).toStrictEqual({
    molecules: set,
    added: 0,
    truncated: false,
    duplicates: 0,
  });
});

test('a row added after a removal never takes a key another row still carries', async () => {
  const set = await rowsOf('CCO ethanol\nCC ethane\nc1ccccc1 benzene');
  const handedOut = set.map((entry) => entry.key);
  const kept = removeRow(set, handedOut[1] as string);
  const { molecules } = appendMolecules(
    kept,
    await rowsOf(`${CAFFEINE} caffeine`),
  );

  expect(molecules).toHaveLength(3);
  const added = molecules[2] as MoleculeRow;
  expect(added.label).toBe('caffeine');
  expect(new Set([...handedOut, added.key]).size).toBe(4);

  // The set is what the pool is given, so the collision shows up as the added
  // molecule wearing the numbers of the one it collided with.
  const results = await predict(molecules);
  expect(results.get(added.key)?.molecularFormula).toBe('C8H10N4O2');
});
