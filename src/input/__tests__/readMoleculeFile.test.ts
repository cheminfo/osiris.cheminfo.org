import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { readMoleculeFile } from '../readMoleculeFile.ts';

const data = join(import.meta.dirname, 'data');

function fileOf(name: string, type = 'text/plain'): File {
  const bytes = readFileSync(join(data, name));
  return new File([bytes], name, { type });
}

test('a dropped SD file is read as an SD file', async () => {
  const result = await readMoleculeFile(fileOf('sample.sdf'));
  expect(result.format).toBe('sdf');
  expect(result.molecules).toHaveLength(4);
});

test('a latin1 file keeps the accents its names were written with', async () => {
  const result = await readMoleculeFile(fileOf('latin1.smi'));
  expect(result.molecules.map((row) => row.label)).toStrictEqual([
    'café',
    'benzène',
  ]);
});

test('a file that will not open is one problem, not a crash', async () => {
  const broken = {
    name: 'gone.sdf',
    arrayBuffer: () => Promise.reject(new Error('gone')),
  } as unknown as File;
  const result = await readMoleculeFile(broken);
  expect(result.problems).toStrictEqual([
    { line: 1, text: 'gone.sdf', reason: 'This file could not be read.' },
  ]);
});

test('an empty file is nothing, not an error', async () => {
  const result = await readMoleculeFile(new File([], 'empty.smi'));
  expect(result.format).toBe('empty');
  expect(result.problems).toHaveLength(0);
});
