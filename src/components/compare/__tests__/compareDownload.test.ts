import { readDelimited } from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import {
  SET_COLUMNS,
  downloadName,
  fieldName,
  sdfRecord,
  setRow,
  toSdf,
  toTsv,
} from '../compareDownload.ts';

import { properties, row } from './fixtures.ts';

/** The smallest thing openchemlib will write that still looks like a molfile. */
const MOLFILE = [
  '',
  '  test',
  '',
  '  0  0  0  0  0  0  0  0  0  0999 V2000',
  'M  END',
].join('\n');

test('the written set carries what the molecule is, then every prediction', () => {
  expect(SET_COLUMNS).toHaveLength(17);
  expect(SET_COLUMNS.slice(0, 3)).toStrictEqual(['Name', 'SMILES', 'idCode']);
  expect(SET_COLUMNS[3]).toBe('cLogP');
  expect(SET_COLUMNS[16]).toBe('Reproductive effects');
});

test('a row is written to the decimals the panel shows, and its risks in words', () => {
  expect(
    setRow(row({ key: 'r0', label: 'ethanol' }), properties()),
  ).toStrictEqual([
    'ethanol',
    'CCO',
    'id-r0',
    '-0.13',
    '0.51',
    '46.07',
    '20.23',
    '-5.79',
    '1',
    '1',
    '0',
    '0',
    '0.37',
    'No risk',
    'No risk',
    'Medium risk',
    'High risk',
  ]);
});

test('a number nobody predicted is an empty cell, never a zero', () => {
  const cells = setRow(row({ key: 'r0' }), properties({ drugScore: null }));
  expect(cells[12]).toBe('');

  const pending = setRow(row({ key: 'r0' }), undefined);
  expect(pending.slice(3)).toStrictEqual(Array.from({ length: 14 }, () => ''));
});

test('the table is tab separated, with a header line, and escapes a name holding a tab', () => {
  const text = toTsv(
    [row({ key: 'r0', label: 'ethanol\there' })],
    new Map([['r0', properties()]]),
  );

  // A name holding the separator is quoted, so reading the file back gives the
  // name that went in rather than two columns.
  expect(text).toContain('"ethanol\there"');
  const table = readDelimited(text, { delimiter: '\t' });
  expect(table[0]).toStrictEqual([...SET_COLUMNS]);
  expect(table[1]).toHaveLength(17);
  expect(table[1]?.[0]).toBe('ethanol\there');
  expect(table[1]?.[5]).toBe('46.07');
});

test('an SD record is the drawing, then one field per column, then the terminator', () => {
  const record = sdfRecord(
    MOLFILE,
    row({ key: 'r0', label: 'ethanol' }),
    properties(),
  );

  expect(record.startsWith('\n  test\n')).toBe(true);
  expect(record).toContain('> <NAME>\nethanol\n\n');
  expect(record).toContain('> <CLOGP>\n-0.13\n\n');
  expect(record).toContain('> <H_BOND_ACCEPTORS>\n1\n\n');
  expect(record).toContain('> <REPRODUCTIVE_EFFECTS>\nHigh risk\n\n');
  expect(record.endsWith('M  END\n> <NAME>\nethanol\n\n')).toBe(false);
  expect(record.endsWith('$$$$\n')).toBe(true);
});

test('a row that cannot be drawn is left out rather than taking the file down', () => {
  const rows = [row({ key: 'r0' }), row({ key: 'r1' })];
  const text = toSdf(rows, new Map([['r0', properties()]]), (given) =>
    given.key === 'r0' ? MOLFILE : null,
  );

  expect(text.split('$$$$').filter((part) => part.trim() !== '')).toHaveLength(
    1,
  );
});

test('a field name says what the column says, in a form every SD reader accepts', () => {
  expect(fieldName('cLogP')).toBe('CLOGP');
  expect(fieldName('H-bond acceptors')).toBe('H_BOND_ACCEPTORS');
  expect(fieldName('Drug score')).toBe('DRUG_SCORE');
  expect(fieldName('idCode')).toBe('IDCODE');
});

test('the file is named after what the set was read from', () => {
  expect(downloadName('library.sdf', 'tsv')).toBe('library.tsv');
  expect(downloadName('', 'sdf')).toBe('osiris-set.sdf');
  expect(downloadName('the pasted list', 'tsv')).toBe('the pasted list.tsv');
  expect(downloadName('a/b.sdf', 'sdf')).toBe('a-b.sdf');
});
