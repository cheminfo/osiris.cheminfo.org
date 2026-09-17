import { expect, test } from 'vitest';

import { splitSmilesList } from '../splitSmilesList.ts';

test('a blank before a word names the structure', () => {
  const { entries } = splitSmilesList('CCO ethanol', 10);
  expect(entries).toStrictEqual([
    { line: 1, structure: 'CCO', label: 'ethanol' },
  ]);
});

test('a name of several words stays one name', () => {
  const { entries } = splitSmilesList('OC(=O)c1ccccc1 benzoic acid', 10);
  expect(entries).toStrictEqual([
    { line: 1, structure: 'OC(=O)c1ccccc1', label: 'benzoic acid' },
  ]);
});

test('a blank before a structure separates two of them', () => {
  const { entries } = splitSmilesList('CCO c1ccccc1 CC', 10);
  expect(entries).toStrictEqual([
    { line: 1, structure: 'CCO', label: '' },
    { line: 1, structure: 'c1ccccc1', label: '' },
    { line: 1, structure: 'CC', label: '' },
  ]);
});

test('the whole list is read one way, decided by a sample of its lines', () => {
  const { entries } = splitSmilesList('CCO c1ccccc1\nCC CCC\nCCCC ethanol', 10);
  expect(entries).toHaveLength(6);
  expect(entries.map((entry) => entry.label)).toStrictEqual([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
});

test('a list the sample cannot decide keeps its names', () => {
  const { entries } = splitSmilesList('CCO ethanol\nc1ccccc1 CC', 10);
  expect(entries).toStrictEqual([
    { line: 1, structure: 'CCO', label: 'ethanol' },
    { line: 2, structure: 'c1ccccc1', label: 'CC' },
  ]);
});

test('semicolons and commas separate, on any line', () => {
  const { entries } = splitSmilesList('CCO;CC,CCC\nCCCC', 10);
  expect(entries).toStrictEqual([
    { line: 1, structure: 'CCO', label: '' },
    { line: 1, structure: 'CC', label: '' },
    { line: 1, structure: 'CCC', label: '' },
    { line: 2, structure: 'CCCC', label: '' },
  ]);
});

test('blank lines and comments are skipped, and the line number survives', () => {
  const { entries } = splitSmilesList(
    '# a list\n\nCCO ethanol\n\nCC ethane',
    10,
  );
  expect(entries).toStrictEqual([
    { line: 3, structure: 'CCO', label: 'ethanol' },
    { line: 5, structure: 'CC', label: 'ethane' },
  ]);
});

test('the cap stops the split and says there was more', () => {
  const { entries, truncated } = splitSmilesList('CCO\nCC\nCCC\nCCCC', 2);
  expect(entries).toHaveLength(2);
  expect(truncated).toBe(true);
});

test('a list that ends exactly on the cap is not truncated', () => {
  const { entries, truncated } = splitSmilesList('CCO\nCC', 2);
  expect(entries).toHaveLength(2);
  expect(truncated).toBe(false);
});
