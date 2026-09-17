/**
 * The two files the site ships: that each is there, that the reader reads it
 * whole, and that what a link says about it is what it holds.
 *
 * The files are generated (`npm run demo-files`), so what has to be checked is
 * not their bytes but the promise the page makes about them — a link offering
 * "26 traded drugs" that opens twenty-five, or one row named after its own
 * SMILES because a field was renamed, is a demo that teaches the wrong thing
 * about the tool on first contact.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { DEMO_FILES, DEMO_FILE_DIRECTORY, demoFileUrl } from '../demoFiles.ts';
import { readMolecules } from '../readMolecules.ts';

const PUBLIC_DEMO = join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  'public',
  'demo',
);

function bytesOf(file: string): Uint8Array {
  return readFileSync(join(PUBLIC_DEMO, file));
}

test('a demo resolves to an address under the mount, never from the root', () => {
  expect(DEMO_FILE_DIRECTORY).toBe('demo/');
  expect(DEMO_FILES.map((demo) => demoFileUrl(demo))).toStrictEqual([
    '/demo/traded-drugs.sdf',
    '/demo/solvents.smi',
  ]);
});

test('every demo is shipped, and the link says how many it holds', async () => {
  for (const demo of DEMO_FILES) {
    expect(existsSync(join(PUBLIC_DEMO, demo.file)), demo.file).toBe(true);
    // eslint-disable-next-line no-await-in-loop -- two files, read in turn.
    const result = await readMolecules(bytesOf(demo.file));
    expect(result.problems, demo.file).toStrictEqual([]);
    expect(result.molecules.length, demo.file).toBe(demo.count);
    expect(demo.label.startsWith(`${demo.count} `), demo.label).toBe(true);
  }
});

test('the SD file is read as one, and every record keeps its name', async () => {
  const result = await readMolecules(bytesOf('traded-drugs.sdf'));

  expect(result.format).toBe('sdf');
  const labels = result.molecules.map((row) => row.label);
  expect(labels[0]).toBe('aspirin');
  expect(labels.at(-1)).toBe('ascorbic acid');
  expect(labels.filter((label) => label === '')).toStrictEqual([]);
});

test('the list keeps its names rather than reading them as structures', async () => {
  const result = await readMolecules(bytesOf('solvents.smi'));

  expect(result.format).toBe('smiles');
  const labels = result.molecules.map((row) => row.label);
  expect(labels[0]).toBe('water');
  expect(labels.at(-1)).toBe('triethylamine');
  // A name is what follows the first blank, and several of these hold one:
  // "dimethyl sulfoxide" is one molecule, not a structure and a leftover.
  expect(labels).toContain('dimethyl sulfoxide');
  expect(labels).toContain('carbon disulfide');
});

test('the demo the drugs card offers is the one the plot is worth reading on', () => {
  const [drugs, solvents] = DEMO_FILES;

  expect(drugs).toStrictEqual({
    file: 'traded-drugs.sdf',
    label: '26 traded drugs',
    kind: 'SD file',
    count: 26,
  });
  expect(solvents).toStrictEqual({
    file: 'solvents.smi',
    label: '34 solvents',
    kind: 'SMILES list',
    count: 34,
  });
});
