/**
 * Session data: the set of molecules being compared, where it came from, and
 * how far the predictor has got through it.
 *
 * A row never holds an `OCL.Molecule` — ten thousand of them cost 198 MB — so
 * what is kept is the idCode and the coordinates, and a visible row is
 * rehydrated from them in a quarter of a millisecond. The properties are not
 * here either: they arrive per row from the worker pool and the page that draws
 * them owns them, so a table can render a row whose prediction is still
 * pending.
 *
 * Nothing here is persisted as it stands; `preferences` keeps the small
 * `{ idCode, label }` mirror that brings a set back after a reload.
 */

import { signal } from '@preact/signals-react';

/** Where the reader is in turning what it was given into rows. */
export type LoadStatus = 'idle' | 'reading' | 'ready' | 'error';

/** One molecule of the comparison set, as the table and the plot key it. */
export interface MoleculeRow {
  /**
   * The position the molecule was read at, as a string. It is the key, never
   * the idCode: a real list holds the same structure twice under two names and
   * both rows must sort, plot and be removable on their own.
   */
  key: string;
  /** The canonical idCode, which is what a duplicate is recognised by. */
  idCode: string;
  /** The atom coordinates the source carried, or an empty string. */
  coordinates: string;
  /** The canonical SMILES, for the address and for a download. */
  smiles: string;
  /** A name from the source, or the SMILES when it carried none. */
  label: string;
  /** `key` of the first row carrying the same idCode, or `null`. */
  duplicateOf: string | null;
}

/** The `data` bucket: plain object, signal leaves, never reassigned. */
export const data = {
  /** What the set was read from, and how reading it went. */
  source: {
    /** The file name, or a short phrase naming what was pasted. */
    name: signal(''),
    status: signal<LoadStatus>('idle'),
    /** Message of the failure that put `status` at `error`. */
    error: signal<string | null>(null),
    /** One line per entry that could not be read, ready to show. */
    problems: signal<readonly string[]>([]),
    /** Whether the set was cut short at the cap. */
    truncated: signal(false),
  },
  /** The set itself, in the order it was read. */
  molecules: signal<readonly MoleculeRow[]>([]),
  /** How far the worker pool has got, and whether it is still running. */
  prediction: {
    done: signal(0),
    total: signal(0),
    running: signal(false),
    /** Why the pool refused to serve results, or `null`. */
    error: signal<string | null>(null),
  },
};

/**
 * Announce that something is being read, before the read runs.
 *
 * The set on screen stays there, so the page does not flash empty between two
 * files.
 * @param name - What to call the source while it is read.
 */
export function startReading(name: string): void {
  data.source.name.value = name;
  data.source.status.value = 'reading';
  data.source.error.value = null;
  data.source.problems.value = [];
  data.source.truncated.value = false;
}

/**
 * Publish the rows a read produced, with whatever it could not read.
 * @param molecules - The rows, in the order they were read.
 * @param outcome - What went wrong on the way, and whether the cap was hit.
 */
export function setMolecules(
  molecules: readonly MoleculeRow[],
  outcome: { problems?: readonly string[]; truncated?: boolean } = {},
): void {
  data.molecules.value = molecules;
  data.source.problems.value = outcome.problems ?? [];
  data.source.truncated.value = outcome.truncated ?? false;
  data.source.status.value = 'ready';
  data.source.error.value = null;
}

/**
 * Record a read that produced nothing at all. The set is left as it was: a
 * file that could not be opened must not wipe the work already on screen.
 * @param message - What to show the reader.
 */
export function failReading(message: string): void {
  data.source.status.value = 'error';
  data.source.error.value = message;
}

/** Empty the comparison entirely, back to the state it started in. */
export function clearMolecules(): void {
  data.molecules.value = [];
  data.source.name.value = '';
  data.source.status.value = 'idle';
  data.source.error.value = null;
  data.source.problems.value = [];
  data.source.truncated.value = false;
  resetPrediction();
}

/**
 * Announce a prediction run over the set.
 * @param total - How many molecules the pool was given.
 */
export function startPrediction(total: number): void {
  data.prediction.total.value = total;
  data.prediction.done.value = 0;
  data.prediction.running.value = true;
  data.prediction.error.value = null;
}

/**
 * Record that one more molecule came back.
 * @param count - How many finished since the last call.
 */
export function advancePrediction(count = 1): void {
  data.prediction.done.value += count;
}

/** Stop the progress line, whether the run finished or was cancelled. */
export function finishPrediction(): void {
  data.prediction.running.value = false;
}

/**
 * Refuse to serve results, and say why: a worker whose resources did not
 * register returns a risk of zero for every molecule, which looks like good
 * news and is not.
 * @param message - What to show the reader.
 */
export function failPrediction(message: string): void {
  data.prediction.running.value = false;
  data.prediction.error.value = message;
}

function resetPrediction(): void {
  data.prediction.done.value = 0;
  data.prediction.total.value = 0;
  data.prediction.running.value = false;
  data.prediction.error.value = null;
}
