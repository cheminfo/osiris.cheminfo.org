/**
 * What the reader is given, and what it hands back.
 *
 * Everything here is plain data: the reader is the boundary between whatever a
 * chemist had on disk and the rest of the site, so it holds no molecule object
 * — ten thousand of them cost 198 MB of heap — and it never throws on what it
 * was given. An entry that could not be read becomes a problem, in its place,
 * and the rest of the set loads.
 */

import type { MoleculeRow } from '../state/data.ts';

export type { MoleculeRow } from '../state/data.ts';

/** How a piece of input turned out to be written. */
export type InputFormat = 'sdf' | 'smiles' | 'empty';

/** Which notation the reader is told to expect. */
export type ReadFormat = 'auto' | 'sdf' | 'smiles';

/** One entry that could not be turned into a molecule. */
export interface InputProblem {
  /** 1-based line of a pasted list, or 1-based record number of an SDF. */
  line: number;
  /** The structure as it was written, shortened to fit on screen. */
  text: string;
  /** Why it could not be read, as one sentence. */
  reason: string;
}

/** Everything one read produced. */
export interface ReadResult {
  /** The molecules, in the order they were read, bad entries left out. */
  molecules: MoleculeRow[];
  /** One per entry that could not be read, in the order they appeared. */
  problems: InputProblem[];
  /** Whether the input held more molecules than the cap allows. */
  truncated: boolean;
  /** Whether the caller's signal stopped the read before the end. */
  aborted: boolean;
  /** How the input turned out to be written. */
  format: InputFormat;
  /** How many molecules repeat an earlier one's idCode. */
  duplicates: number;
}

/** How a read is run. */
export interface ReadOptions {
  /**
   * The notation to read the input as. `auto` decides from the text itself.
   * @default 'auto'
   */
  format?: ReadFormat;
  /**
   * The most molecules to read; past it the read stops and says so.
   * @default MAX_MOLECULES
   */
  maxMolecules?: number;
  /**
   * Called as the read advances, with the entries done and the entries there
   * are. A read is chunked, so this runs on the browser's turn, not on every
   * entry.
   * @default undefined
   */
  onProgress?: (done: number, total: number) => void;
  /**
   * Stops the read; what was read so far comes back with `aborted` set.
   * @default undefined
   */
  signal?: AbortSignal;
}

/** One structure the input holds, before anything tried to read it. */
export interface InputEntry {
  /** 1-based line of a pasted list, or 1-based record number of an SDF. */
  line: number;
  /** The structure exactly as written: one line notation, or a whole molfile. */
  structure: string;
  /** The name the source gave it, empty when it gave none. */
  label: string;
}

/** What splitting an input into entries produced. */
export interface SplitResult {
  /** The entries, in the order they appear. */
  entries: InputEntry[];
  /** Whether the input held more entries than the cap allows. */
  truncated: boolean;
}
