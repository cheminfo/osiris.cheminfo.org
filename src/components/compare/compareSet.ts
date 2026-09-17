/**
 * What a set carries away with it: the part of it an address can hold, and the
 * part of it a browser keeps between two visits.
 *
 * The two are deliberately different. An address holds about a hundred and
 * fifty structures before it stops being a link anybody can paste, so it takes
 * as many as fit and the page says what it left behind. Storage holds the whole
 * set, as an idCode and a name each — 78 kB for a thousand molecules, against
 * megabytes for the molecules themselves, and every number is predicted again
 * in the page anyway.
 */

import type { MoleculeRow, StoredMolecule } from '../../state/index.ts';
import { SHARED_QUERY_LENGTH, SHARED_SMILES_LIMIT } from '../../state/index.ts';

/** What separates two structures in an address. */
const SEPARATOR = ',';

/** How many characters a separator costs once the address is encoded. */
const SEPARATOR_COST = encodeURIComponent(SEPARATOR).length;

/** The part of a set an address can carry. */
export interface SharePlan {
  /** The structures, comma separated, as the `smiles` parameter takes them. */
  text: string;
  /** How many of the set's rows that is. */
  count: number;
}

/**
 * The longest prefix of a set that still fits in an address.
 *
 * Measured against the *encoded* length, which is what a browser and a course
 * page actually carry: a SMILES is full of characters that cost three
 * characters each once written into a query.
 * @param rows - The set, in order.
 * @returns The text to put in the address, and how many rows it names.
 */
export function sharePlan(rows: readonly MoleculeRow[]): SharePlan {
  const pieces: string[] = [];
  let length = 0;
  for (const row of rows) {
    if (pieces.length === SHARED_SMILES_LIMIT) break;
    const cost =
      encodeURIComponent(row.smiles).length +
      (pieces.length === 0 ? 0 : SEPARATOR_COST);
    if (length + cost > SHARED_QUERY_LENGTH) break;
    length += cost;
    pieces.push(row.smiles);
  }
  return { text: pieces.join(SEPARATOR), count: pieces.length };
}

/**
 * The set as it is kept between two visits.
 * @param rows - The set.
 * @returns Its idCodes and names, in order.
 */
export function storedOf(rows: readonly MoleculeRow[]): StoredMolecule[] {
  const stored: StoredMolecule[] = [];
  for (const row of rows) {
    stored.push({ idCode: row.idCode, label: row.label });
  }
  return stored;
}

/**
 * Rebuild a set from what was kept of it.
 *
 * A structure that no longer reads is dropped rather than reported: this is a
 * set the reader had open yesterday, not something they just typed, and a
 * column of complaints about it is not what they came back for.
 * @param stored - What was kept.
 * @returns The rows, in the order they were kept.
 */
export async function restoreRows(
  stored: readonly StoredMolecule[],
): Promise<MoleculeRow[]> {
  if (stored.length === 0) return [];
  const { describeMolecule, moleculeFromIdCode, moleculeRow } =
    await import('../../input/index.ts');
  const rows: MoleculeRow[] = [];
  const firstSeen = new Map<string, string>();
  for (const molecule of stored) {
    try {
      const identity = describeMolecule(moleculeFromIdCode(molecule.idCode));
      const previous = firstSeen.get(identity.idCode) ?? null;
      const row = moleculeRow({
        position: rows.length,
        identity,
        label: molecule.label,
        duplicateOf: previous,
      });
      if (previous === null) firstSeen.set(identity.idCode, row.key);
      rows.push(row);
    } catch {
      continue;
    }
  }
  return rows;
}
