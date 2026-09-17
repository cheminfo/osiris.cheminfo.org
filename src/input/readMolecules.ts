/**
 * Turning whatever the reader was given into a list of molecules.
 *
 * This never throws on what it was given. An entry that will not read becomes
 * a problem, in its place, and every other entry still loads: one bad record
 * of ten thousand must not cost the set. A file worth two thousand structures
 * is real work, so the read runs in chunks and hands the thread back between
 * them — the progress line moves and Cancel answers.
 */

import { ensureString } from 'ensure-string';
import { runInChunks } from 'react-cheminfo/core';

import { MAX_MOLECULES, MAX_STRUCTURE_LENGTH } from '../state/limits.ts';

import { detectFormat } from './detectFormat.ts';
import { TOO_LONG_MESSAGE } from './errors.ts';
import { describeMolecule, moleculeFromStructure } from './molecule.ts';
import { readSdfRecords } from './readSdfRecords.ts';
import { moleculeRow, problemOf, refusedEntry } from './rows.ts';
import { splitSmilesList } from './splitSmilesList.ts';
import type {
  InputProblem,
  MoleculeRow,
  ReadOptions,
  ReadResult,
  SplitResult,
} from './types.ts';

/** What a read can be given: text, or the bytes of a file. */
export type MoleculeInput = string | ArrayBuffer | Uint8Array;

/**
 * Read a list of molecules out of whatever was pasted, dropped or linked.
 * @param input - The text, or the bytes of a file, which are decoded first.
 * @param options - See {@link ReadOptions}.
 * @returns The molecules, what could not be read, and how the input was written.
 */
export async function readMolecules(
  input: MoleculeInput,
  options: ReadOptions = {},
): Promise<ReadResult> {
  const { format: requested, maxMolecules, onProgress, signal } = options;
  const limit = cappedLimit(maxMolecules);
  const text = decode(input);
  const format =
    requested === undefined || requested === 'auto'
      ? detectFormat(text)
      : requestedFormat(text, requested);
  if (format === 'empty') return emptyResult();

  const split: SplitResult =
    format === 'sdf'
      ? readSdfRecords(text, limit)
      : splitSmilesList(text, limit);

  const molecules: MoleculeRow[] = [];
  const problems: InputProblem[] = [];
  const firstSeen = new Map<string, string>();
  let duplicates = 0;
  let aborted = false;
  // A line notation is about one character per atom, and reading one is
  // super-linear in atoms: 2000 characters cost 4.2 s of the thread the page
  // draws on, with no yield inside the entry, and a link may name 8000. An SD
  // record is a molfile, whose length says nothing about its atom count, so it
  // is not held to the same number.
  const boundStructures = format === 'smiles';

  try {
    await runInChunks(
      split.entries,
      (entry) => {
        if (boundStructures && entry.structure.length > MAX_STRUCTURE_LENGTH) {
          problems.push(refusedEntry(entry, TOO_LONG_MESSAGE));
          return;
        }
        try {
          const identity = describeMolecule(
            moleculeFromStructure(entry.structure),
          );
          const previous = firstSeen.get(identity.idCode) ?? null;
          const row = moleculeRow({
            position: molecules.length,
            identity,
            label: entry.label,
            duplicateOf: previous,
          });
          if (previous === null) firstSeen.set(identity.idCode, row.key);
          else duplicates++;
          molecules.push(row);
        } catch (error) {
          problems.push(problemOf(entry, error));
        }
      },
      { sliceMs: SLICE_MS, chunkSize: CHUNK_SIZE, onProgress, signal },
    );
  } catch (error) {
    // Every failure of an entry is already a problem row, so the only thing
    // that leaves that loop is the caller's signal. Anything else is the
    // caller's own bug and is not swallowed.
    if (signal?.aborted !== true) throw error;
    aborted = true;
  }

  return {
    molecules,
    problems,
    truncated: split.truncated,
    aborted,
    format,
    duplicates,
  };
}

/** Milliseconds of reading between two turns handed back to the browser. */
const SLICE_MS = 30;

/** Entries read between two looks at the clock; one costs about 0.4 ms. */
const CHUNK_SIZE = 25;

/**
 * An empty read, which is what nothing at all produces.
 * @returns A result holding no molecule and no problem.
 */
export function emptyResult(): ReadResult {
  return {
    molecules: [],
    problems: [],
    truncated: false,
    aborted: false,
    format: 'empty',
    duplicates: 0,
  };
}

function decode(input: MoleculeInput): string {
  // Never `file.text()`: it decodes as UTF-8 whatever the bytes are, so a
  // latin1 SD file comes back mojibaked, and it keeps the byte-order mark.
  return typeof input === 'string' ? input : ensureString(input);
}

function requestedFormat(
  text: string,
  format: 'sdf' | 'smiles',
): ReadResult['format'] {
  return text.trim() === '' ? 'empty' : format;
}

function cappedLimit(requested: number | undefined): number {
  if (requested === undefined || !Number.isFinite(requested)) {
    return MAX_MOLECULES;
  }
  return Math.min(Math.max(Math.trunc(requested), 1), MAX_MOLECULES);
}
