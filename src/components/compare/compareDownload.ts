/**
 * The set, written out: a table anybody can open, and an SD file anything
 * chemical can read.
 *
 * Both are built from one column list, so the two files always say the same
 * thing about the same molecule. A number that was never predicted is written
 * as an empty cell rather than as a zero — a spreadsheet averaging a column of
 * invented zeros is the quiet way a prediction becomes a wrong result.
 *
 * Neither writer touches OpenChemLib: the molfile of a row is handed in, so
 * these are plain string functions and the tests that pin them are too.
 */

import { sanitizeFileName, toDelimited } from 'react-cheminfo/core';

import type { OsirisProperties, PropertyKey } from '../../osiris/index.ts';
import {
  PROPERTY_KEYS,
  RISK_LABELS,
  RISK_LEVEL_LABELS,
  RISK_TYPES,
  propertyScale,
  propertyValue,
} from '../../osiris/index.ts';
import type { MoleculeRow } from '../../state/index.ts';

/** What a molfile is asked for; `null` when the row cannot be drawn. */
export type MolfileOf = (row: MoleculeRow) => string | null;

/** The columns before the predicted ones: what the molecule is. */
const IDENTITY_COLUMNS = ['Name', 'SMILES', 'idCode'] as const;

/** Every column of the written set, in order. */
export const SET_COLUMNS: readonly string[] = [
  ...IDENTITY_COLUMNS,
  ...PROPERTY_KEYS.map((key) => propertyScale(key).label),
  ...RISK_TYPES.map((risk) => RISK_LABELS[risk]),
];

/**
 * One row of the written set.
 * @param row - The molecule.
 * @param properties - What was predicted for it, or `undefined` when nothing
 * was.
 * @returns One cell per column of {@link SET_COLUMNS}.
 */
export function setRow(
  row: MoleculeRow,
  properties: OsirisProperties | undefined,
): string[] {
  const cells: string[] = [row.label, row.smiles, row.idCode];
  for (const key of PROPERTY_KEYS) cells.push(numberCell(properties, key));
  for (const risk of RISK_TYPES) {
    cells.push(
      properties === undefined ? '' : RISK_LEVEL_LABELS[properties.risks[risk]],
    );
  }
  return cells;
}

/**
 * The set as a tab-separated table, with a header line.
 * @param rows - The molecules to write, in the order they are shown.
 * @param results - What has been predicted, by row key.
 * @returns The file's text.
 */
export function toTsv(
  rows: readonly MoleculeRow[],
  results: ReadonlyMap<string, OsirisProperties>,
): string {
  const table: string[][] = [];
  for (const row of rows) table.push(setRow(row, results.get(row.key)));
  return `${toDelimited(table, { header: SET_COLUMNS })}\n`;
}

/**
 * The set as an SD file, one record per molecule.
 * @param rows - The molecules to write, in the order they are shown.
 * @param results - What has been predicted, by row key.
 * @param molfileOf - How to draw one row; a row it cannot draw is left out.
 * @returns The file's text.
 */
export function toSdf(
  rows: readonly MoleculeRow[],
  results: ReadonlyMap<string, OsirisProperties>,
  molfileOf: MolfileOf,
): string {
  const records: string[] = [];
  for (const row of rows) {
    const molfile = molfileOf(row);
    if (molfile === null) continue;
    records.push(sdfRecord(molfile, row, results.get(row.key)));
  }
  return records.join('');
}

/**
 * One record of an SD file: the drawing, then every column as a field.
 * @param molfile - The molecule, as a molfile.
 * @param row - The row it came from.
 * @param properties - What was predicted for it, or `undefined`.
 * @returns The record, terminator included.
 */
export function sdfRecord(
  molfile: string,
  row: MoleculeRow,
  properties: OsirisProperties | undefined,
): string {
  const cells = setRow(row, properties);
  let record = `${molfile.replace(TRAILING_NEWLINES, '')}\n`;
  for (let column = 0; column < SET_COLUMNS.length; column++) {
    const value = cells[column] ?? '';
    if (value === '') continue;
    record += `> <${fieldName(SET_COLUMNS[column] ?? '')}>\n${value}\n\n`;
  }
  return `${record}$$$$\n`;
}

/**
 * An SD field name built from a column name: upper case, and nothing in it that
 * a reader of these files has to guess at.
 * @param label - The column name.
 * @returns The field name.
 */
export function fieldName(label: string): string {
  return label
    .toUpperCase()
    .replaceAll(NON_WORD, '_')
    .replaceAll(EDGE_UNDERSCORES, '');
}

/**
 * What the written file is called.
 * @param source - What the set was read from, which may be empty.
 * @param extension - The extension, without its dot.
 * @returns A file name a browser and a file system both accept.
 */
export function downloadName(source: string, extension: string): string {
  const base = sanitizeFileName(source.replace(EXTENSION, '').trim(), '');
  return `${base === '' ? DEFAULT_NAME : base}.${extension}`;
}

/** What a set with no source of its own is called. */
const DEFAULT_NAME = 'osiris-set';

const TRAILING_NEWLINES = /[\n\r]+$/;
const NON_WORD = /[^A-Z0-9]+/g;
const EDGE_UNDERSCORES = /^_+|_+$/g;
const EXTENSION = /\.[^.]{1,8}$/;

function numberCell(
  properties: OsirisProperties | undefined,
  key: PropertyKey,
): string {
  if (properties === undefined) return '';
  const value = propertyValue(properties, key);
  // `toFixed`, never the screen's formatter: a thousands separator turns a
  // column of molecular weights into text the next tool cannot add up.
  return value === null ? '' : value.toFixed(propertyScale(key).decimals);
}
