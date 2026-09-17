/**
 * What the comparison table reads off a set that is still filling in.
 *
 * A prediction costs a fifth of a second, so a row exists long before its
 * numbers do. Everything here is written around that: a row has a status before
 * it has values, a cell says which of the three it is, and the mask the table
 * filters on is the same `Uint8Array` the figure paints with — two definitions
 * of "kept" is how a plot and the list under it come to disagree.
 */

import { MISSING_VALUE, formatDecimal } from 'react-cheminfo/core';

import type { OsirisProperties, PropertyKey } from '../../osiris/index.ts';
import { propertyScale, propertyValue } from '../../osiris/index.ts';
import type { MoleculeRow } from '../../state/index.ts';

/** Where one row is: waiting for a worker, answered, or refused. */
export type RowStatus = 'pending' | 'ready' | 'failed';

/** What a cell says while its molecule is still being predicted. */
export const PENDING_TEXT = '…';

/**
 * Where one row is.
 * @param key - The row's key.
 * @param results - What has been predicted, by row key.
 * @param failures - Why each refused row was refused, by row key.
 * @returns Its status.
 */
export function rowStatusOf(
  key: string,
  results: ReadonlyMap<string, OsirisProperties>,
  failures: ReadonlyMap<string, string>,
): RowStatus {
  if (results.has(key)) return 'ready';
  return failures.has(key) ? 'failed' : 'pending';
}

/**
 * What one numeric cell shows.
 * @param properties - What was predicted for the row, or `undefined`.
 * @param key - Which of the ten numbers the column is.
 * @param status - Where the row is.
 * @returns The number as the panel writes it, the waiting marker, or the
 * missing marker — never a zero standing in for an answer nobody has.
 */
export function cellText(
  properties: OsirisProperties | undefined,
  key: PropertyKey,
  status: RowStatus,
): string {
  if (status === 'pending') return PENDING_TEXT;
  if (properties === undefined) return MISSING_VALUE;
  const value = propertyValue(properties, key);
  if (value === null) return MISSING_VALUE;
  return formatDecimal(value, propertyScale(key).decimals);
}

/**
 * Drop the rows repeating a structure the set already holds.
 *
 * Applied to the same mask the brushes wrote, so the plot, the table, the
 * stated count and the download all agree on what the set is.
 * @param included - One byte per row, `1` for kept. Written in place.
 * @param rows - The set, in the figure's row order.
 * @returns The same mask.
 */
export function hideDuplicates(
  included: Uint8Array,
  rows: readonly MoleculeRow[],
): Uint8Array {
  const count = Math.min(included.length, rows.length);
  for (let row = 0; row < count; row++) {
    if ((rows[row] as MoleculeRow).duplicateOf !== null) included[row] = 0;
  }
  return included;
}

/**
 * The rows a mask keeps, as indices into the set.
 * @param included - One byte per row, `1` for kept.
 * @param limit - The most indices to return, so a set of two thousand does not
 * mount two thousand structure drawings at once.
 * @returns The kept rows' indices, in set order.
 */
export function keptIndices(included: Uint8Array, limit: number): number[] {
  const indices: number[] = [];
  for (let row = 0; row < included.length; row++) {
    if (included[row] === 0) continue;
    indices.push(row);
    if (indices.length === limit) break;
  }
  return indices;
}

/**
 * Where the focused molecule sits in the set.
 *
 * A link names a structure, not a row, so an address focuses the first row
 * carrying it. A click names the row itself — a real list holds the same
 * structure twice under two names, and clicking the second must not open the
 * first — so the clicked row's key decides whenever the set still holds it and
 * it still carries the focused structure. A stale key falls back to the
 * structure, which is what a removal or a step back through the history leaves.
 * @param rows - The set.
 * @param idCode - The focused structure, or `null`.
 * @param key - The key of the row that was clicked, or `null` for an address.
 * @returns Its index, or `-1` when the set no longer holds it.
 */
export function focusIndexOf(
  rows: readonly MoleculeRow[],
  idCode: string | null,
  key: string | null = null,
): number {
  if (idCode === null) return -1;
  if (key !== null) {
    for (let row = 0; row < rows.length; row++) {
      const entry = rows[row] as MoleculeRow;
      if (entry.key === key) {
        return entry.idCode === idCode ? row : firstOf(rows, idCode);
      }
    }
  }
  return firstOf(rows, idCode);
}

/**
 * Take one row out of the set.
 *
 * Every other row keeps the key it was given, so the answers already predicted
 * stay attached to their molecules and nothing is computed twice. Only the
 * "repeats an earlier row" marks are worked out again, since removing the first
 * of two identical structures promotes the second.
 * @param rows - The set as it stands.
 * @param key - The row to remove.
 * @returns The set without it.
 */
export function removeRow(
  rows: readonly MoleculeRow[],
  key: string,
): MoleculeRow[] {
  const kept: MoleculeRow[] = [];
  const firstSeen = new Map<string, string>();
  for (const row of rows) {
    if (row.key === key) continue;
    const previous = firstSeen.get(row.idCode) ?? null;
    if (previous === null) firstSeen.set(row.idCode, row.key);
    kept.push(
      row.duplicateOf === previous ? row : { ...row, duplicateOf: previous },
    );
  }
  return kept;
}

function firstOf(rows: readonly MoleculeRow[], idCode: string): number {
  for (let row = 0; row < rows.length; row++) {
    if ((rows[row] as MoleculeRow).idCode === idCode) return row;
  }
  return -1;
}
