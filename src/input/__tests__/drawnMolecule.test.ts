import { expect, test } from 'vitest';

import { readDrawnMolecule } from '../drawnMolecule.ts';

test('what the pen drew becomes a set of one', () => {
  const result = readDrawnMolecule({
    idCode: 'gFp@DiTt@@@ !B?g~w@k_}mwvw?@',
    label: 'benzene',
  });
  expect(result.molecules).toStrictEqual([
    {
      key: 'r0',
      idCode: 'gFp@DiTt@@@',
      coordinates: '!B?g~w@k_}mwvw?@',
      smiles: 'c1ccccc1',
      label: 'benzene',
      duplicateOf: null,
    },
  ]);
});

test('an unnamed structure is called by its own SMILES', () => {
  const result = readDrawnMolecule({ idCode: 'gFp@DiTt@@@' });
  expect(result.molecules[0]?.label).toBe('c1ccccc1');
});

test('an erased canvas is nothing yet, not a failure', () => {
  for (const idCode of ['', ' ', 'd@', 'dH']) {
    const result = readDrawnMolecule({ idCode });
    expect(result.molecules).toHaveLength(0);
    expect(result.problems).toHaveLength(0);
    expect(result.format).toBe('empty');
  }
});

test('an idCode that is not one is refused rather than decoded', () => {
  const result = readDrawnMolecule({ idCode: 'zzz' });
  expect(result.molecules).toHaveLength(0);
  expect(result.problems).toStrictEqual([
    { line: 1, text: 'zzz', reason: 'This structure could not be read.' },
  ]);
});
