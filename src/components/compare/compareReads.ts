/**
 * The three reads that put molecules into the set, and the one that brings a
 * set back after a reload.
 *
 * All four load `src/input` on demand: it imports OpenChemLib outright, and a
 * visitor who opens somebody's link should not pay 1.2 MB before the page
 * appears. None of them throws on what the reader supplied — an entry that will
 * not read becomes a line saying so, in its place, and every other entry still
 * loads.
 */

import type { MoleculeRow } from '../../state/index.ts';
import { MAX_MOLECULES, failReading, state } from '../../state/index.ts';

import { restoreRows } from './compareSet.ts';

/** How the set is handed back once a read has produced it. */
export type PublishRows = (
  rows: readonly MoleculeRow[],
  problems?: readonly string[],
) => void;

/** What one read was asked to do. */
export interface ReadRequest {
  /** What to call the source while it is read. */
  name: string;
  /** The text to read, when it was pasted or carried by a link. */
  text?: string;
  /** The file to read, when one was dropped or chosen. */
  file?: File;
  /**
   * Whether this came from the address, in which case a structure the set
   * already holds is skipped rather than added again.
   * @default false
   */
  linked?: boolean;
}

/** The set a read produced, and what it has to say about the entries. */
export interface ReadOutcome {
  /** The whole set, the newly read rows last. */
  molecules: MoleculeRow[];
  /** One line per entry that could not be read, and the cap when it was hit. */
  problems: string[];
}

/**
 * Read what the reader gave, and merge it into the set as it stands.
 * @param request - See {@link ReadRequest}.
 * @param signal - Stops the read; the rows read so far are still returned.
 * @param onProgress - Called as entries are turned into rows.
 * @returns See {@link ReadOutcome}.
 */
export async function readRequest(
  request: ReadRequest,
  signal: AbortSignal,
  onProgress: (done: number, total: number) => void,
): Promise<ReadOutcome> {
  const { appendMolecules, problemLines, readMoleculeFile, readMolecules } =
    await import('../../input/index.ts');
  const options = { signal, onProgress };
  const result =
    request.file === undefined
      ? await readMolecules(request.text ?? '', options)
      : await readMoleculeFile(request.file, options);

  const held = state.data.molecules.peek();
  // A link adds what the set does not already hold: arriving from the explorer
  // with one molecule must not throw away the forty already on the page. A
  // pasted list is taken as written, repeats included — the reader asked for
  // them, and both rows have to be removable on their own.
  const fresh =
    request.linked === true
      ? result.molecules.filter((row) => !holds(held, row.idCode))
      : result.molecules;
  const merged = appendMolecules(held, fresh);
  const problems = problemLines(result);
  if (merged.truncated || result.truncated) {
    problems.push(`The set holds at most ${MAX_MOLECULES} structures.`);
  }
  return { molecules: merged.molecules, problems };
}

/**
 * Add what the editor is holding to the set.
 * @param idCode - The editor's value: an idCode, its coordinates after a space.
 * @param publish - How the merged set is handed back.
 */
export async function addDrawn(
  idCode: string,
  publish: PublishRows,
): Promise<void> {
  const { appendMolecules, readDrawnMolecule } =
    await import('../../input/index.ts');
  const result = readDrawnMolecule({ idCode });
  const row = result.molecules[0];
  if (row === undefined) {
    failReading(result.problems[0]?.reason ?? 'Draw a structure first.');
    return;
  }
  publish(appendMolecules(state.data.molecules.peek(), [row]).molecules, []);
}

/**
 * Bring back the set this browser was last working on.
 * @param publish - How the set is handed back; not called when nothing was kept.
 */
export async function restoreStored(publish: PublishRows): Promise<void> {
  const stored = state.preferences.set.molecules.peek();
  if (stored.length === 0) return;
  const rows = await restoreRows(stored);
  if (rows.length > 0) publish(rows, []);
}

function holds(rows: readonly MoleculeRow[], idCode: string): boolean {
  for (const row of rows) {
    if (row.idCode === idCode) return true;
  }
  return false;
}
