import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { detectFormat } from '../detectFormat.ts';

test('a file holding a record separator is an SD file', () => {
  const text = readFileSync(
    join(import.meta.dirname, 'data/sample.sdf'),
    'latin1',
  );
  expect(detectFormat(text)).toBe('sdf');
});

test('a lone molfile is read the same way as an SD file', () => {
  const molfile = [
    'ethanol',
    '  OSIRIS test',
    '',
    '  1  0  0  0  0  0  0  0  0  0999 V2000',
    '    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0',
    'M  END',
  ].join('\n');
  expect(detectFormat(molfile)).toBe('sdf');
});

test('a list of line notations is a SMILES list', () => {
  expect(detectFormat('CCO ethanol\nc1ccccc1 benzene')).toBe('smiles');
});

test('a molecular weight on its own line is not a molfile', () => {
  expect(detectFormat('46.07\n78.11')).toBe('smiles');
});

test('nothing at all is nothing at all', () => {
  expect(detectFormat('  \n \n')).toBe('empty');
});
