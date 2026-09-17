/**
 * Everything the reader chose that must survive a reload: how the plot is
 * coloured, and the set they were working on.
 *
 * Two persisted buckets, two versioned keys — the display choices are cheap and
 * change constantly, the set is the reader's own work and changes rarely, and a
 * corrupt payload in one must not take the other down with it.
 *
 * The set is stored as `{ idCode, label }` and nothing else: 78 kB for a
 * thousand molecules, against megabytes for the molecules themselves, and every
 * property is recomputed in the page anyway.
 */

import { signal } from '@preact/signals-react';
import { DEFAULT_COLOR_SCALE_ID } from 'react-cheminfo/core';

import { persistBucket } from './persist.ts';

/** What is kept of one molecule between two visits. */
export interface StoredMolecule {
  idCode: string;
  label: string;
}

const display = persistBucket('osiris:preferences', {
  /** Which named colour scale the plot's lines are ramped along. */
  colorScaleId: signal<string>(DEFAULT_COLOR_SCALE_ID),
  /** Whether the table shows the rows a duplicate idCode marks. */
  showDuplicates: signal(true),
});

const saved = persistBucket('osiris:set', {
  /** The last set compared, small enough to store and enough to rebuild it. */
  molecules: signal<readonly StoredMolecule[]>([]),
});

/** The `preferences` bucket: plain object, signal leaves, never reassigned. */
export const preferences = { ...display, set: saved };

/**
 * Ramp the plot along another colour scale.
 * @param id - A named scale of `react-cheminfo`, or a serialized custom one.
 */
export function setColorScale(id: string): void {
  preferences.colorScaleId.value = id;
}

/**
 * Show or hide the rows whose structure is already in the set.
 * @param show - True to keep every row, duplicates included.
 */
export function setShowDuplicates(show: boolean): void {
  preferences.showDuplicates.value = show;
}

/**
 * Remember the set, so closing the tab does not lose an afternoon's reading.
 * @param molecules - The set, as its idCodes and labels.
 */
export function rememberSet(molecules: readonly StoredMolecule[]): void {
  preferences.set.molecules.value = molecules;
}

/** Forget the stored set. The UI puts this behind a confirmation. */
export function forgetSet(): void {
  preferences.set.molecules.value = [];
}
