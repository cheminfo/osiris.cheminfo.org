/**
 * Two small pieces of state the comparison page keeps while it reads: how far
 * the current read has got, and how much of the set the address ended up
 * carrying.
 *
 * Signals at module scope, like the rest of the app's state, and for the same
 * reason: what writes them is a read that outlives a render — an address
 * followed, a file being decoded — and React state written from there either
 * cascades a render inside the effect that started it or is written to a
 * variable the render has already finished with.
 */

import { signal } from '@preact/signals-react';

/** How far a read has got through what it was given. */
export interface ReadProgress {
  /** Entries turned into rows so far. */
  done: number;
  /** Entries the input holds. */
  total: number;
}

/** The read in progress, or `null` when nothing is being read. */
export const readProgress = signal<ReadProgress | null>(null);

/** How many of the set's rows the address carries. */
export const sharedCount = signal(0);
