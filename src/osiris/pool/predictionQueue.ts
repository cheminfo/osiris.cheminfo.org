/**
 * What is still to be predicted, in the order it will be.
 *
 * Arrival order by default, because that is the order the reader read the file
 * in. On top of it sits a short list of keys to answer first — the rows
 * actually on screen — which is re-laid every time the reader scrolls or
 * focuses a row. A key named as wanted that has since been answered or removed
 * is skipped rather than looked up again.
 */

import type { PredictionInput } from './poolTypes.ts';

/** The molecules waiting, and which of them to take next. */
export interface PredictionQueue {
  /** How many are waiting. */
  readonly size: number;
  /**
   * Whether one is waiting.
   * @param key - The row's key.
   * @returns True when it is still queued.
   */
  has: (key: string) => boolean;
  /**
   * Queue one molecule, unless its key is already waiting.
   * @param input - The molecule.
   * @returns True when it was added.
   */
  add: (input: PredictionInput) => boolean;
  /**
   * Take the next molecule to predict: the first still-queued key of the wanted
   * list, else the one that has waited longest.
   * @returns The molecule, or `undefined` when nothing is waiting.
   */
  take: () => PredictionInput | undefined;
  /**
   * Replace the list of keys to answer first.
   * @param keys - The keys, most wanted first.
   */
  prioritize: (keys: readonly string[]) => void;
  /** Forget everything waiting. */
  clear: () => void;
}

/**
 * A queue of molecules to predict.
 * @returns The queue, empty.
 */
export function createPredictionQueue(): PredictionQueue {
  const waiting = new Map<string, PredictionInput>();
  let wanted: readonly string[] = [];
  let cursor = 0;

  return {
    get size() {
      return waiting.size;
    },
    has: (key) => waiting.has(key),
    add(input) {
      if (waiting.has(input.key)) return false;
      waiting.set(input.key, input);
      return true;
    },
    take() {
      while (cursor < wanted.length) {
        const key = wanted[cursor] as string;
        cursor += 1;
        const next = waiting.get(key);
        if (next !== undefined) {
          waiting.delete(key);
          return next;
        }
      }
      const first = waiting.keys().next();
      if (first.done === true) return undefined;
      const next = waiting.get(first.value) as PredictionInput;
      waiting.delete(first.value);
      return next;
    },
    prioritize(keys) {
      wanted = [...keys];
      cursor = 0;
    },
    clear() {
      waiting.clear();
      wanted = [];
      cursor = 0;
    },
  };
}
