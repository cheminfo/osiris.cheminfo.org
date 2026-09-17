import { expect, test } from 'vitest';

import type { MoleculeRow } from '../../../state/index.ts';
import { SHARED_SMILES_LIMIT } from '../../../state/index.ts';
import { focusIndexOf, hideDuplicates, removeRow } from '../compareRows.ts';
import { restoreRows, sharePlan, storedOf } from '../compareSet.ts';

import { row } from './fixtures.ts';

test('the address carries the set until it stops being a link anybody can paste', () => {
  const small = [
    row({ key: 'r0', smiles: 'CCO' }),
    row({ key: 'r1', smiles: 'c1ccccc1' }),
  ];
  expect(sharePlan(small)).toStrictEqual({ text: 'CCO,c1ccccc1', count: 2 });

  const many = Array.from({ length: SHARED_SMILES_LIMIT + 40 }, (_, index) =>
    row({ key: `r${index}`, smiles: 'CCO' }),
  );
  const plan = sharePlan(many);
  expect(plan.count).toBe(SHARED_SMILES_LIMIT);
  expect(plan.text.split(',')).toHaveLength(SHARED_SMILES_LIMIT);
});

test('a structure is never cut in half to make a link fit', () => {
  const long = 'C'.repeat(400);
  const many = Array.from({ length: 60 }, (_, index) =>
    row({ key: `r${index}`, smiles: long }),
  );
  const plan = sharePlan(many);

  expect(plan.count).toBeLessThan(60);
  for (const piece of plan.text.split(',')) expect(piece).toBe(long);
});

test('what is kept between two visits is an idCode and a name, and nothing else', () => {
  expect(
    storedOf([row({ key: 'r0', idCode: 'gFp@DiTt@@@', label: 'benzene' })]),
  ).toStrictEqual([{ idCode: 'gFp@DiTt@@@', label: 'benzene' }]);
});

test('a stored set comes back as rows, and a structure that no longer reads is dropped', async () => {
  const rows = await restoreRows([
    { idCode: 'gFp@DiTt@@@', label: 'benzene' },
    { idCode: 'not-an-idcode', label: 'nonsense' },
  ]);

  expect(rows).toHaveLength(1);
  expect(rows[0]?.key).toBe('r0');
  expect(rows[0]?.label).toBe('benzene');
  expect(rows[0]?.smiles).toBe('c1ccccc1');
  expect(rows[0]?.coordinates).not.toBe('');
});

test('removing a row keeps every other key, so nothing is predicted twice', () => {
  const rows = [
    row({ key: 'r0', idCode: 'a' }),
    row({ key: 'r1', idCode: 'b' }),
    row({ key: 'r2', idCode: 'c' }),
  ];

  expect(removeRow(rows, 'r1').map((kept) => kept.key)).toStrictEqual([
    'r0',
    'r2',
  ]);
});

test('removing the first of two identical structures promotes the second', () => {
  const rows = [
    row({ key: 'r0', idCode: 'a' }),
    row({ key: 'r1', idCode: 'a', duplicateOf: 'r0' }),
    row({ key: 'r2', idCode: 'a', duplicateOf: 'r0' }),
  ];
  const kept = removeRow(rows, 'r0');

  expect(kept.map((entry) => entry.duplicateOf)).toStrictEqual([null, 'r1']);
});

test('the repeated-structure switch writes on the same mask the brushes do', () => {
  const rows = [
    row({ key: 'r0', idCode: 'a' }),
    row({ key: 'r1', idCode: 'a', duplicateOf: 'r0' }),
    row({ key: 'r2', idCode: 'b' }),
  ];
  const mask = hideDuplicates(new Uint8Array([1, 1, 1]), rows);

  expect([...mask]).toStrictEqual([1, 0, 1]);
});

test('the focused molecule is found by its structure, and forgotten when it leaves', () => {
  const rows = [
    row({ key: 'r0', idCode: 'a' }),
    row({ key: 'r1', idCode: 'b' }),
  ];

  expect(focusIndexOf(rows, 'b')).toBe(1);
  expect(focusIndexOf(rows, 'gone')).toBe(-1);
  expect(focusIndexOf(rows, null)).toBe(-1);
});

test('clicking a row focuses that row, even when an earlier one holds the same structure', () => {
  const rows = [
    row({ key: 'r0', idCode: 'a', label: 'first name' }),
    row({ key: 'r1', idCode: 'a', duplicateOf: 'r0', label: 'second name' }),
    row({ key: 'r2', idCode: 'b' }),
  ];

  // What a click hands back is the row's own key and its structure.
  for (let index = 0; index < rows.length; index++) {
    const clicked = rows[index] as MoleculeRow;
    expect(focusIndexOf(rows, clicked.idCode, clicked.key)).toBe(index);
  }
});

test('a link names a structure, so it opens the first row carrying it', () => {
  const rows = [
    row({ key: 'r0', idCode: 'a' }),
    row({ key: 'r1', idCode: 'a', duplicateOf: 'r0' }),
  ];

  expect(focusIndexOf(rows, 'a', null)).toBe(0);
  // The clicked row has since been removed, or the address moved to another
  // structure: the key is stale and the structure decides.
  expect(focusIndexOf(rows, 'a', 'r9')).toBe(0);
  expect(focusIndexOf(rows, 'b', 'r1')).toBe(-1);
  expect(focusIndexOf(rows, null, 'r1')).toBe(-1);
});
