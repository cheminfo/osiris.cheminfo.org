import { expect, test } from 'vitest';

import { MAX_STRUCTURE_LENGTH } from '../../state/limits.ts';
import { SHARE_PARAMS, readShareParams } from '../params.ts';

test('an address carrying nothing reads as every setting at its default', () => {
  expect(readShareParams({})).toStrictEqual({
    smiles: '',
    idcode: '',
    axes: '',
    color: '',
    focus: '',
  });
});

test('a charged SMILES survives the round trip with its plus', () => {
  const smiles = 'CC[N+](C)(C)C';

  expect(readShareParams({ smiles }).smiles).toBe(smiles);
  expect(SHARE_PARAMS.smiles.serialize(smiles)).toBe(smiles);
});

test('a link nobody typed by hand is cut rather than obeyed', () => {
  const long = 'C'.repeat(MAX_STRUCTURE_LENGTH + 100);

  expect(readShareParams({ idcode: long }).idcode).toHaveLength(
    MAX_STRUCTURE_LENGTH,
  );
  expect(readShareParams({ color: 'x'.repeat(200) }).color).toHaveLength(40);
});

test('a setting at its default is deleted from the address, never written', () => {
  expect(SHARE_PARAMS.smiles.serialize('')).toBeNull();
  expect(SHARE_PARAMS.axes.serialize('')).toBeNull();
  expect(SHARE_PARAMS.focus.serialize('')).toBeNull();
});

test('a key the site does not know is ignored, not carried', () => {
  expect(readShareParams({ nonsense: '1', axes: 'logP,logS' })).toStrictEqual({
    smiles: '',
    idcode: '',
    axes: 'logP,logS',
    color: '',
    focus: '',
  });
});
