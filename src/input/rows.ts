/**
 * Building the rows a set is made of, and the lines said about what failed.
 *
 * A row is keyed by the position it was read at, never by its idCode: a real
 * list holds the same structure twice under two names — two thousand of ten
 * thousand records, in one public file — and both rows have to sort, plot and
 * be removed on their own. The repeat is a field, `duplicateOf`, pointing at
 * the row that came first.
 */

import { looksLikeMolfile } from 'react-cheminfo/core';

import { readableError } from './errors.ts';
import { shortenLabel, titleLine } from './labels.ts';
import type { StructureIdentity } from './molecule.ts';
import type {
  InputEntry,
  InputFormat,
  InputProblem,
  MoleculeRow,
  ReadResult,
} from './types.ts';

/** What one row of a set is built from. */
export interface RowInput {
  /** The row's position in the set, counted from zero. */
  position: number;
  /** What was read off the molecule. */
  identity: StructureIdentity;
  /** The name the source gave, empty when it gave none. */
  label: string;
  /** The key of the first row carrying this idCode, or `null`. */
  duplicateOf: string | null;
}

/**
 * Build one row of a set.
 * @param input - See {@link RowInput}.
 * @returns The row, named by its source or by its own SMILES.
 */
export function moleculeRow(input: RowInput): MoleculeRow {
  const { position, identity, label, duplicateOf } = input;
  const name = shortenLabel(label);
  return {
    key: rowKey(position),
    idCode: identity.idCode,
    coordinates: identity.coordinates,
    smiles: identity.smiles,
    label: name === '' ? identity.smiles : name,
    duplicateOf,
  };
}

/**
 * The key a row read at one position carries.
 * @param position - The position in the set, counted from zero.
 * @returns The key.
 */
export function rowKey(position: number): string {
  return `r${position}`;
}

/**
 * The position a key was minted at.
 * @param key - The key.
 * @returns The position, or `-1` for anything this module did not mint.
 */
export function rowKeyPosition(key: string): number {
  if (!KEY_SHAPE.test(key)) return -1;
  return Number(key.slice(1));
}

/** What a key looks like: `r` and the position it was handed out at. */
const KEY_SHAPE = /^r\d+$/;

/**
 * Record why one entry did not become a molecule.
 * @param entry - The entry that failed.
 * @param error - Whatever reading it threw.
 * @returns The problem, ready to be shown.
 */
export function problemOf(entry: InputEntry, error: unknown): InputProblem {
  return refusedEntry(entry, readableError(error));
}

/**
 * Record that one entry was refused before anything tried to read it.
 * @param entry - The entry.
 * @param reason - Why, as the one sentence a reader sees.
 * @returns The problem, ready to be shown.
 */
export function refusedEntry(entry: InputEntry, reason: string): InputProblem {
  return { line: entry.line, text: quoted(entry.structure), reason };
}

/**
 * Write one problem as the line a reader sees.
 * @param problem - The problem.
 * @param format - How the input was written, which decides what to call its entries.
 * @returns One line, naming where it happened and why.
 */
export function formatProblem(
  problem: InputProblem,
  format: InputFormat,
): string {
  const where = format === 'sdf' ? 'Record' : 'Line';
  const quote = problem.text === '' ? '' : `${problem.text} — `;
  return `${where} ${problem.line}: ${quote}${problem.reason}`;
}

/**
 * Everything a read has to say about what it could not do, in order.
 * @param result - What the read produced.
 * @returns One line per unreadable entry, then the cap and the stop when they applied.
 */
export function problemLines(result: ReadResult): string[] {
  const lines: string[] = [];
  for (const problem of result.problems) {
    lines.push(formatProblem(problem, result.format));
  }
  if (result.truncated) {
    const read = result.molecules.length + result.problems.length;
    lines.push(`Only the first ${read} structures were read.`);
  }
  if (result.aborted) lines.push('Reading was stopped.');
  return lines;
}

/** The longest piece of the offending structure a problem line quotes. */
const QUOTE_LENGTH = 60;

function quoted(structure: string): string {
  const text = looksLikeMolfile(structure)
    ? titleLine(structure)
    : structure.trim();
  if (text.length <= QUOTE_LENGTH) return text;
  return `${text.slice(0, QUOTE_LENGTH - 1).trimEnd()}…`;
}
