/**
 * Adding what was just read to what is already on screen.
 *
 * Rows added at the end keep every key already handed out: a focused row stays
 * focused and a plotted line stays where it was. A new key continues past the
 * highest the set carries rather than counting its rows — a removal leaves a
 * hole, and a reissued key would file the new molecule's answers under a row
 * that is still on screen. What the merge does compute is which of the new rows
 * repeat a structure the set already holds.
 */

import { MAX_MOLECULES } from '../state/limits.ts';

import { rowKey, rowKeyPosition } from './rows.ts';
import type { MoleculeRow } from './types.ts';

/** What a merge produced. */
export interface AppendResult {
  /** The whole set, the new rows last. */
  molecules: MoleculeRow[];
  /** How many of the offered rows were taken. */
  added: number;
  /** Whether the set was full and rows had to be left out. */
  truncated: boolean;
  /** How many of the added rows repeat a structure already in the set. */
  duplicates: number;
}

/** How a merge is capped. */
export interface AppendOptions {
  /**
   * The most molecules the set may hold.
   * @default MAX_MOLECULES
   */
  maxMolecules?: number;
}

/**
 * Add molecules to a set, keeping the keys the set already handed out.
 * @param existing - The set as it stands.
 * @param added - The rows to add, in the order they were read.
 * @param options - See {@link AppendOptions}.
 * @returns The merged set, and what it did with the offered rows.
 */
export function appendMolecules(
  existing: readonly MoleculeRow[],
  added: readonly MoleculeRow[],
  options: AppendOptions = {},
): AppendResult {
  const limit = Math.min(
    Math.max(Math.trunc(options.maxMolecules ?? MAX_MOLECULES), 1),
    MAX_MOLECULES,
  );
  const molecules = existing.slice(0, limit);
  const firstSeen = new Map<string, string>();
  for (const row of molecules) {
    if (!firstSeen.has(row.idCode)) {
      firstSeen.set(row.idCode, row.duplicateOf ?? row.key);
    }
  }

  let duplicates = 0;
  let position = nextPosition(molecules);
  for (let index = 0; index < added.length; index++) {
    const row = added[index];
    if (row === undefined) continue;
    if (molecules.length === limit) {
      return { molecules, added: index, truncated: true, duplicates };
    }
    const key = rowKey(position++);
    const previous = firstSeen.get(row.idCode) ?? null;
    if (previous === null) firstSeen.set(row.idCode, key);
    else duplicates++;
    molecules.push({ ...row, key, duplicateOf: previous });
  }
  return {
    molecules,
    added: added.length,
    truncated: existing.length > limit,
    duplicates,
  };
}

function nextPosition(rows: readonly MoleculeRow[]): number {
  let highest = -1;
  for (const row of rows) {
    const position = rowKeyPosition(row.key);
    if (position > highest) highest = position;
  }
  return highest + 1;
}
