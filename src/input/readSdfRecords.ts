/**
 * Cutting an SD file into its records.
 *
 * openchemlib's own `SDFileParser` does the splitting, not `sdf-parser`: that
 * one cuts a record on a newline followed by `>`, so an SD value beginning
 * with `>` — a boiling point written `>200` — loses its field and invents
 * column names for the rest of the file.
 *
 * Its own trap: a null field list plus `getField()` inside the loop stops
 * after the first record. The names are therefore scanned once by a throwaway
 * parser, and the parser that reads the file is given the list.
 */

import { SDFileParser } from 'openchemlib';
import { looksLikeMolfile } from 'react-cheminfo/core';

import { nameFieldsOf, titleLine } from './labels.ts';
import type { InputEntry, SplitResult } from './types.ts';

/**
 * Cut an SD file into one entry per record, each carrying its own molfile.
 * @param text - The file, as it was read.
 * @param limit - The most records to return; past it the split stops.
 * @returns The records in file order, and whether more were left.
 */
export function readSdfRecords(text: string, limit: number): SplitResult {
  const names = nameFieldsOf(scanFieldNames(text));
  const parser = new SDFileParser(text, names);
  const entries: InputEntry[] = [];
  while (parser.next()) {
    if (entries.length === limit) return { entries, truncated: true };
    const molfile = parser.getNextMolFile();
    entries.push({
      line: entries.length + 1,
      structure: molfile,
      label: recordLabel(parser, names, molfile),
    });
  }
  // A single molfile carries no record separator, so the parser reports none.
  if (entries.length === 0 && looksLikeMolfile(text)) {
    entries.push({ line: 1, structure: text, label: titleLine(text) });
  }
  return { entries, truncated: false };
}

/**
 * How many records are read to find out which fields the file uses. A name
 * field absent from all of them is rare, and the molfile's title line catches
 * that record anyway.
 */
const FIELD_SCAN_RECORDS = 200;

function scanFieldNames(text: string): string[] {
  // The declared field list is `string[]`, but the parser's own documentation
  // says a null list is what makes it scan the file for the names: an empty
  // array reports none at all.
  const scanner = new SDFileParser(text, null as unknown as string[]);
  const found = scanner.getFieldNames(FIELD_SCAN_RECORDS);
  const names: string[] = [];
  for (const name of found) {
    if (typeof name === 'string' && name !== '') names.push(name);
  }
  return names;
}

function recordLabel(
  parser: SDFileParser,
  names: readonly string[],
  molfile: string,
): string {
  for (const name of names) {
    const value: string | null = parser.getField(name);
    const first = firstLine(value ?? '');
    if (first !== '') return first;
  }
  return titleLine(molfile);
}

function firstLine(value: string): string {
  const end = value.indexOf('\n');
  return (end === -1 ? value : value.slice(0, end)).trim();
}
