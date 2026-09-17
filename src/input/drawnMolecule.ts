/**
 * Reading what the pen drew.
 *
 * The editor hands over an idCode with the atom layout after it, which is the
 * exact drawing and the cheapest thing to carry. An erased canvas is not a
 * failure: it is nothing yet, and the page says so in its own words rather
 * than showing an error.
 */

import { isEmptyIdCode } from 'react-cheminfo/core';

import { describeMolecule, moleculeFromIdCode } from './molecule.ts';
import { emptyResult } from './readMolecules.ts';
import { moleculeRow, problemOf } from './rows.ts';
import type { ReadResult } from './types.ts';

/** A structure as the editor hands it over. */
export interface DrawnStructure {
  /** The editor's value: an idCode, and the coordinates after a space. */
  idCode: string;
  /**
   * What to call it; its own SMILES when this is empty.
   * @default ''
   */
  label?: string;
}

/**
 * Read the structure on the canvas as a set of one.
 * @param drawn - See {@link DrawnStructure}.
 * @returns One molecule, or nothing at all when the canvas is empty.
 */
export function readDrawnMolecule(drawn: DrawnStructure): ReadResult {
  const { idCode, label = '' } = drawn;
  if (idCode.trim() === '' || isEmptyIdCode(idCode)) return emptyResult();
  const entry = { line: 1, structure: idCode, label };
  try {
    const identity = describeMolecule(moleculeFromIdCode(idCode));
    return {
      molecules: [
        moleculeRow({ position: 0, identity, label, duplicateOf: null }),
      ],
      problems: [],
      truncated: false,
      aborted: false,
      format: 'smiles',
      duplicates: 0,
    };
  } catch (error) {
    return {
      ...emptyResult(),
      format: 'smiles',
      problems: [problemOf(entry, error)],
    };
  }
}
