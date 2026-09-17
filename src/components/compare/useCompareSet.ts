/**
 * The set the comparison page works on: where it comes from, what it becomes,
 * and where it is written back to.
 *
 * Three doors lead in — a link, a pasted list, a dropped file — and one path
 * leads out: every change goes through `publish`, which puts the rows in the
 * state, writes as much of the set as fits into the address, and keeps the
 * whole of it for the next visit. One path means the table, the link and the
 * stored copy cannot disagree.
 *
 * The address is read back only when something other than this page wrote it —
 * a link opened, a back button pressed. The page remembers the text it wrote
 * last, so its own writing never comes round again as a fresh set to read.
 */

import { useCallback, useEffect, useRef } from 'react';
import { errorMessage } from 'react-cheminfo/core';

import type { LoadStatus, MoleculeRow } from '../../state/index.ts';
import {
  clearMolecules,
  failReading,
  forgetSet,
  rememberSet,
  setCompareSmiles,
  setMolecules,
  startReading,
  state,
} from '../../state/index.ts';

import type { ReadProgress } from './compareProgress.ts';
import { readProgress, sharedCount } from './compareProgress.ts';
import type { ReadRequest } from './compareReads.ts';
import { addDrawn, readRequest, restoreStored } from './compareReads.ts';
import { removeRow } from './compareRows.ts';
import { restoreRows, sharePlan, storedOf } from './compareSet.ts';

/**
 * Open the set an address names, on top of the set this browser kept.
 *
 * The address is a lossy mirror: it carries the first
 * `SHARED_SMILES_LIMIT` structures and no names at all. So the stored set is
 * brought back first and the link is merged into it — `readRequest` already
 * skips a structure the set holds — rather than being rebuilt from the mirror
 * and then published over the copy it came from. Without this a reload cuts a
 * set of three hundred down to a hundred and fifty nameless rows, permanently,
 * and opening somebody else's link erases the set the reader had.
 * @param linked - The `smiles` parameter, as the address carries it.
 * @param read - How a request is read and published.
 */
export async function openLinkedSet(
  linked: string,
  read: (request: ReadRequest) => Promise<void>,
): Promise<void> {
  await restoreHeldSet();
  await read({ text: linked, name: 'the link', linked: true });
}

/** The set, and everything that changes it. */
export interface CompareSet {
  /** The set, in the order it was read. */
  rows: readonly MoleculeRow[];
  /** Where the reader is in turning what it was given into rows. */
  status: LoadStatus;
  /** Why the last read produced nothing at all, or `null`. */
  error: string | null;
  /** One line per entry that could not be read. */
  problems: readonly string[];
  /** How many of the set's rows the address carries. */
  shared: number;
  /** How far the current read has got, or `null` when nothing is being read. */
  reading: ReadProgress | null;
  /**
   * Add whatever a reader pasted.
   * @param text - A list of SMILES, a molfile, or a whole SD file.
   * @param name - What to call it while it is read.
   */
  addText: (text: string, name: string) => void;
  /**
   * Add a dropped or chosen file.
   * @param file - The file, whatever its extension says it is.
   */
  addFile: (file: File) => void;
  /**
   * Add what the editor is holding.
   * @param idCode - The editor's value: an idCode, its coordinates after a space.
   */
  addStructure: (idCode: string) => void;
  /**
   * Take one row out.
   * @param key - The row's key.
   */
  remove: (key: string) => void;
  /** Empty the set, and forget it. */
  clear: () => void;
}

/**
 * The comparison set, and the four things that change it.
 * @returns See {@link CompareSet}.
 */
export function useCompareSet(): CompareSet {
  const rows = state.data.molecules.value;
  const linked = state.view.compare.smiles.value;
  const applied = useRef<string | null>(null);
  const reading = useRef<AbortController | null>(null);

  const publish = useCallback(
    (next: readonly MoleculeRow[], problems?: readonly string[]) => {
      setMolecules(next, {
        problems: problems ?? state.data.source.problems.peek(),
        truncated: state.data.source.truncated.peek(),
      });
      const plan = sharePlan(next);
      // Before the signal, so the effect that follows the address recognises
      // this as the page's own writing and does not read it back in.
      applied.current = plan.text;
      sharedCount.value = plan.count;
      setCompareSmiles(plan.text);
      rememberSet(storedOf(next));
    },
    [],
  );

  const read = useCallback(
    async (request: ReadRequest) => {
      reading.current?.abort();
      const controller = new AbortController();
      reading.current = controller;
      startReading(request.name);
      readProgress.value = { done: 0, total: 0 };
      try {
        const outcome = await readRequest(
          request,
          controller.signal,
          (done, total) => {
            readProgress.value = { done, total };
          },
        );
        if (!controller.signal.aborted) {
          publish(outcome.molecules, outcome.problems);
        }
      } catch (error) {
        if (!controller.signal.aborted) failReading(errorMessage(error));
      } finally {
        if (reading.current === controller) {
          reading.current = null;
          readProgress.value = null;
        }
      }
    },
    [publish],
  );

  useEffect(() => {
    if (applied.current === linked) return;
    applied.current = linked;
    if (linked === '') {
      void restoreStored(publish);
      return;
    }
    void openLinkedSet(linked, read);
  }, [linked, publish, read]);

  const addText = useCallback(
    (text: string, name: string) => {
      void read({ text, name });
    },
    [read],
  );
  const addFile = useCallback(
    (file: File) => {
      void read({ file, name: file.name });
    },
    [read],
  );
  const addStructure = useCallback(
    (idCode: string) => {
      void addDrawn(idCode, publish);
    },
    [publish],
  );
  const remove = useCallback(
    (key: string) => {
      publish(removeRow(state.data.molecules.peek(), key));
    },
    [publish],
  );
  const clear = useCallback(() => {
    reading.current?.abort();
    clearMolecules();
    forgetSet();
    applied.current = '';
    sharedCount.value = 0;
    setCompareSmiles('');
  }, []);

  return {
    rows,
    status: state.data.source.status.value,
    error: state.data.source.error.value,
    problems: state.data.source.problems.value,
    shared: sharedCount.value,
    reading: readProgress.value,
    addText,
    addFile,
    addStructure,
    remove,
    clear,
  };
}

/**
 * Put the set this browser kept back in the state, without publishing it.
 *
 * Nothing is written to the address or to storage: the rows are only there to
 * be merged into, and the publish that follows the read is what writes both.
 */
async function restoreHeldSet(): Promise<void> {
  if (state.data.molecules.peek().length > 0) return;
  const stored = state.preferences.set.molecules.peek();
  if (stored.length === 0) return;
  const rows = await restoreRows(stored);
  if (rows.length > 0) setMolecules(rows);
}
