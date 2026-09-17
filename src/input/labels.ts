/**
 * What a molecule is called on screen.
 *
 * An SD file names its records in whatever field its writer chose, so the list
 * below is broad and is matched on a normalised key: `IUPAC_NAME`,
 * `iupac name` and `IupacName` are one field. A sibling site's narrower list
 * missed `IUPAC_NAME` and `CATALOG_ID`, and a public file of a hundred records
 * loaded with no name at all.
 */

import { MAX_LABEL_LENGTH } from '../state/limits.ts';

/**
 * The fields a name is taken from, best first, normalised the way
 * {@link nameFieldsOf} normalises a file's own field names.
 */
export const NAME_FIELDS: readonly string[] = [
  'name',
  'title',
  'iupacname',
  'preferredname',
  'commonname',
  'compoundname',
  'chemicalname',
  'molname',
  'moleculename',
  'compound',
  'label',
  'id',
  'catalogid',
  'compoundid',
  'moleculeid',
  'identifier',
  'registrynumber',
  'casrn',
  'cas',
];

/**
 * Pick the fields of an SD file a name should be read from, best first.
 * @param fieldNames - Every field name the file uses, as the parser reports them.
 * @returns The name-carrying ones, in the order they should be tried.
 */
export function nameFieldsOf(fieldNames: readonly string[]): string[] {
  const byKey = new Map<string, string>();
  for (const name of fieldNames) {
    if (typeof name !== 'string' || name === '') continue;
    const key = normalize(name);
    if (!byKey.has(key)) byKey.set(key, name);
  }
  const picked: string[] = [];
  for (const wanted of NAME_FIELDS) {
    const name = byKey.get(wanted);
    if (name !== undefined) picked.push(name);
  }
  return picked;
}

/**
 * The first line of a molfile, which is where a writer puts the record's name
 * when it puts it anywhere.
 * @param molfile - The record, as it was written.
 * @returns The title line, trimmed, or an empty string.
 */
export function titleLine(molfile: string): string {
  const end = molfile.indexOf('\n');
  return (end === -1 ? molfile : molfile.slice(0, end)).trim();
}

/**
 * Cut a name down to what a table cell can show.
 * @param label - The name as the source wrote it.
 * @returns The name, shortened with an ellipsis when it is too long.
 */
export function shortenLabel(label: string): string {
  const text = label.trim().replaceAll(/\s+/g, ' ');
  if (text.length <= MAX_LABEL_LENGTH) return text;
  return `${text.slice(0, MAX_LABEL_LENGTH - 1).trimEnd()}…`;
}

function normalize(name: string): string {
  return name.toLowerCase().replaceAll(/[^a-z\d]/g, '');
}
