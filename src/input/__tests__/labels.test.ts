import { expect, test } from 'vitest';

import { MAX_LABEL_LENGTH } from '../../state/limits.ts';
import { nameFieldsOf, shortenLabel, titleLine } from '../labels.ts';

test('a name field is recognised however its writer spelled it', () => {
  expect(nameFieldsOf(['MW', 'IUPAC_NAME', 'CATALOG_ID'])).toStrictEqual([
    'IUPAC_NAME',
    'CATALOG_ID',
  ]);
});

test('the best name field comes first, whatever order the file lists them in', () => {
  expect(nameFieldsOf(['ID', 'Title', 'Name'])).toStrictEqual([
    'Name',
    'Title',
    'ID',
  ]);
});

test('a file with nothing name-shaped offers no name field', () => {
  expect(nameFieldsOf(['MW', 'LOGP', 'bp'])).toStrictEqual([]);
});

test('the molfile title line is its first line', () => {
  expect(titleLine('  acetic acid  \n  OSIRIS\n\n')).toBe('acetic acid');
  expect(titleLine('\n  OSIRIS\n')).toBe('');
});

test('a name is cut to what a cell shows, and says it was cut', () => {
  const long = 'a'.repeat(MAX_LABEL_LENGTH + 10);
  const short = shortenLabel(long);
  expect(short).toHaveLength(MAX_LABEL_LENGTH);
  expect(short.endsWith('…')).toBe(true);
});

test('a name keeps its words and loses its extra blanks', () => {
  expect(shortenLabel('  benzoic\t acid \n')).toBe('benzoic acid');
});
