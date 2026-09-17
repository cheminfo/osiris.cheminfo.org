/**
 * What the explorer does with the address it was opened on. The page reads its
 * two structure signals through this, so the rules a link obeys — the idCode
 * wins, an erased canvas is not a structure, a SMILES has to be read first —
 * are checked with no DOM and no openchemlib.
 */

import { expect, test } from 'vitest';

import {
  asRiskType,
  explorerRequest,
  structureValue,
} from '../explorerRequest.ts';

test('nothing drawn and nothing linked is nothing to do', () => {
  expect(explorerRequest('', '')).toStrictEqual({ kind: 'empty' });
  expect(explorerRequest('', ' \n\t')).toStrictEqual({ kind: 'empty' });
});

test('an erased canvas is not a structure', () => {
  // Erasing leaves the editor holding the idCode of the molecule with no
  // atoms, which every predictor answers with innocent values.
  expect(explorerRequest('d@', '')).toStrictEqual({ kind: 'empty' });
  expect(explorerRequest('d@ !Bb@_', '')).toStrictEqual({ kind: 'empty' });
});

test('the drawing is taken apart into the idCode and its layout', () => {
  expect(explorerRequest('gFp@DiTt@@@ !Bb@_Ohp`', '')).toStrictEqual({
    kind: 'ready',
    structure: { idCode: 'gFp@DiTt@@@', coordinates: '!Bb@_Ohp`' },
  });
});

test('an idCode with no layout is still a structure to predict', () => {
  expect(explorerRequest('gFp@DiTt@@@', '')).toStrictEqual({
    kind: 'ready',
    structure: { idCode: 'gFp@DiTt@@@', coordinates: '' },
  });
});

test('a linked SMILES has to be read into a structure first', () => {
  expect(explorerRequest('', 'c1ccccc1')).toStrictEqual({
    kind: 'resolve',
    smiles: 'c1ccccc1',
  });
  expect(explorerRequest('', '  CC[N+](C)(C)C  ')).toStrictEqual({
    kind: 'resolve',
    smiles: 'CC[N+](C)(C)C',
  });
});

test('the idCode wins over the SMILES, because it is the exact structure', () => {
  expect(explorerRequest('gFp@DiTt@@@', 'CCO')).toStrictEqual({
    kind: 'ready',
    structure: { idCode: 'gFp@DiTt@@@', coordinates: '' },
  });
});

test('the structure is written back the way openchemlib writes the pair', () => {
  expect(
    structureValue({ idCode: 'gFp@DiTt@@@', coordinates: '!Bb@_Ohp`' }),
  ).toBe('gFp@DiTt@@@ !Bb@_Ohp`');
  expect(structureValue({ idCode: 'gFp@DiTt@@@', coordinates: '' })).toBe(
    'gFp@DiTt@@@',
  );
});

test('only one of the four risks opens an explanation', () => {
  expect(asRiskType('mutagenic')).toBe('mutagenic');
  expect(asRiskType('reproductive')).toBe('reproductive');
  expect(asRiskType(null)).toBeNull();
  expect(asRiskType('')).toBeNull();
  expect(asRiskType('carcinogenic')).toBeNull();
});
