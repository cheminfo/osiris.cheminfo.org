import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { MAX_LABEL_LENGTH, MAX_STRUCTURE_LENGTH } from '../../state/limits.ts';
import { TOO_LONG_MESSAGE } from '../errors.ts';
import { readMolecules } from '../readMolecules.ts';
import { problemLines } from '../rows.ts';

const data = join(import.meta.dirname, 'data');

function fixture(name: string): Uint8Array {
  return readFileSync(join(data, name));
}

test('an SD file is read record by record, names and all', async () => {
  const result = await readMolecules(fixture('sample.sdf'));
  expect(result.format).toBe('sdf');
  expect(result.molecules).toHaveLength(4);
  expect(result.molecules.map((row) => row.label)).toStrictEqual([
    'ethanol',
    'benzene',
    'CAT-77',
    'acetic acid',
  ]);
  expect(result.molecules.map((row) => row.key)).toStrictEqual([
    'r0',
    'r1',
    'r2',
    'r3',
  ]);
});

test('an SD value beginning with ">" does not cost the record its name', async () => {
  const text = readFileSync(join(data, 'sample.sdf'), 'latin1');
  expect(text).toContain('>  <bp>\n>200');
  const result = await readMolecules(text);
  expect(result.molecules[0]?.label).toBe('ethanol');
  expect(result.molecules[0]?.smiles).toBe('CCO');
});

test('a record with no atom is a problem, not a molecule', async () => {
  const result = await readMolecules(fixture('sample.sdf'));
  expect(result.problems[0]).toStrictEqual({
    line: 3,
    text: 'nothing here',
    reason: 'This structure holds no atom.',
  });
});

test('a record that crashes the parser gets the floor message', async () => {
  const result = await readMolecules(fixture('sample.sdf'));
  expect(result.problems).toHaveLength(2);
  expect(result.problems[1]?.line).toBe(6);
  expect(result.problems[1]?.reason).toBe('This structure could not be read.');
});

test('the same structure under two names is two rows, the second a duplicate', async () => {
  const result = await readMolecules(fixture('sample.sdf'));
  expect(result.duplicates).toBe(1);
  const [first, , duplicate] = result.molecules;
  expect(duplicate?.label).toBe('CAT-77');
  expect(duplicate?.idCode).toBe(first?.idCode);
  expect(duplicate?.duplicateOf).toBe('r0');
  expect(first?.duplicateOf).toBeNull();
});

test('an SD record carries the drawing it was written with', async () => {
  const result = await readMolecules(fixture('sample.sdf'));
  expect(result.molecules[1]?.coordinates.length).toBeGreaterThan(0);
});

test('a .smi list keeps its names and reports only the line that failed', async () => {
  const result = await readMolecules(fixture('list.smi'));
  expect(result.format).toBe('smiles');
  expect(result.molecules.map((row) => row.label)).toStrictEqual([
    'ethanol',
    'benzene',
    'acetic acid',
  ]);
  expect(result.problems).toStrictEqual([
    { line: 5, text: 'c1ccccc', reason: 'Dangling ring closure: 1' },
  ]);
  expect(problemLines(result)).toStrictEqual([
    'Line 5: c1ccccc — Dangling ring closure: 1',
  ]);
});

test('a latin1 file is decoded as latin1, not as UTF-8', async () => {
  const result = await readMolecules(fixture('latin1.smi'));
  expect(result.molecules.map((row) => row.label)).toStrictEqual([
    'café',
    'benzène',
  ]);
});

test.each([
  ['newline', 'CCO\nc1ccccc1'],
  ['semicolon', 'CCO;c1ccccc1'],
  ['comma', 'CCO,c1ccccc1'],
  ['space', 'CCO c1ccccc1'],
  ['several at once', 'CCO, c1ccccc1;\n'],
])('a list separated by a %s holds two molecules', async (_, text) => {
  const result = await readMolecules(text);
  expect(result.molecules.map((row) => row.smiles)).toStrictEqual([
    'CCO',
    'c1ccccc1',
  ]);
});

test('a name after a structure is a name, not a second structure', async () => {
  const result = await readMolecules('CCO ethanol\nc1ccccc1 benzene');
  expect(result.molecules).toHaveLength(2);
  expect(result.molecules[0]?.label).toBe('ethanol');
});

test('a molecule with no name is called by its own SMILES', async () => {
  const result = await readMolecules('c1ccccc1');
  expect(result.molecules[0]?.label).toBe('c1ccccc1');
});

test('a very long name is cut to what a cell can show', async () => {
  const result = await readMolecules(`CCO ${'name '.repeat(40)}`);
  const label = result.molecules[0]?.label ?? '';
  expect(label).toHaveLength(MAX_LABEL_LENGTH);
  expect(label.endsWith('…')).toBe(true);
});

test('the cap stops the read and says how much was read', async () => {
  const text = 'CCO\nCCC\nCCCC\nCCCCC\nCCCCCC';
  const result = await readMolecules(text, { maxMolecules: 3 });
  expect(result.molecules).toHaveLength(3);
  expect(result.truncated).toBe(true);
  expect(problemLines(result)).toStrictEqual([
    'Only the first 3 structures were read.',
  ]);
});

test('nothing at all is not an error', async () => {
  const result = await readMolecules('   \n  \n');
  expect(result).toStrictEqual({
    molecules: [],
    problems: [],
    truncated: false,
    aborted: false,
    format: 'empty',
    duplicates: 0,
  });
});

test('a single molfile with no record separator is one molecule', async () => {
  const text = readFileSync(join(data, 'sample.sdf'), 'latin1');
  const molfile = text.slice(0, text.indexOf('>  <bp>'));
  const result = await readMolecules(molfile);
  expect(result.format).toBe('sdf');
  expect(result.molecules).toHaveLength(1);
  expect(result.molecules[0]?.smiles).toBe('CCO');
});

test('an abort stops the read and keeps what it had', async () => {
  const controller = new AbortController();
  controller.abort();
  const result = await readMolecules('CCO\nCCC', { signal: controller.signal });
  expect(result.aborted).toBe(true);
  expect(result.molecules).toHaveLength(0);
  expect(problemLines(result)).toStrictEqual(['Reading was stopped.']);
});

test('progress is reported against the number of entries', async () => {
  const seen: Array<[number, number]> = [];
  await readMolecules('CCO\nCCC\nCCCC', {
    onProgress: (done, total) => seen.push([done, total]),
  });
  expect(seen.at(-1)).toStrictEqual([3, 3]);
});

test('a line notation too long to read is refused, and the rest of the list still loads', async () => {
  const long = 'C'.repeat(MAX_STRUCTURE_LENGTH + 1);
  const started = performance.now();
  const result = await readMolecules(`CCO ethanol\n${long}\nCC ethane`);
  const elapsed = performance.now() - started;

  expect(result.molecules.map((row) => row.label)).toStrictEqual([
    'ethanol',
    'ethane',
  ]);
  expect(result.problems).toStrictEqual([
    {
      line: 2,
      text: `${'C'.repeat(59)}…`,
      reason: TOO_LONG_MESSAGE,
    },
  ]);
  // Refused before it is parsed: reading it costs about half a second, and a
  // link may name one of eight thousand characters.
  expect(elapsed).toBeLessThan(200);
});

test('the length a line notation is held to is not applied to an SD record', async () => {
  const records = fixture('sample.sdf');
  expect(records.byteLength).toBeGreaterThan(MAX_STRUCTURE_LENGTH);
  const result = await readMolecules(records);

  expect(result.molecules).toHaveLength(4);
  for (const problem of result.problems) {
    expect(problem.reason).not.toBe(TOO_LONG_MESSAGE);
  }
});
