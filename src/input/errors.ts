/**
 * What a reader says when a structure will not read.
 *
 * openchemlib is compiled from Java, so a malformed record can crash inside
 * the generated code with `Cannot read properties of undefined (reading 'd')`
 * — a real message, from a real public SDF, that names nothing a chemist can
 * act on. There is a floor under every reason for that case.
 */

import { structureError } from 'react-cheminfo/core';

/** What is said when the failure names nothing useful. */
export const UNREADABLE_MESSAGE = 'This structure could not be read.';

/** What is said for text that parses into a molecule with no atoms. */
export const NO_ATOMS_MESSAGE = 'This structure holds no atom.';

/** What is said for a substructure query, which has no properties. */
export const QUERY_MESSAGE = 'This is a substructure query, not a molecule.';

/** What is said for an entry refused on its length, before anything read it. */
export const TOO_LONG_MESSAGE = 'This structure is too long to read.';

/**
 * Turn whatever a parser threw into one sentence worth showing.
 * @param error - Whatever was thrown.
 * @returns The reason, or the floor message when the failure names nothing.
 */
export function readableError(error: unknown): string {
  if (!(error instanceof Error)) return UNREADABLE_MESSAGE;
  // A TypeError or a RangeError out of openchemlib is the generated code
  // crashing, not a verdict on the structure.
  if (error.name === 'TypeError' || error.name === 'RangeError') {
    return UNREADABLE_MESSAGE;
  }
  const { message } = structureError(error);
  return message === '' ? UNREADABLE_MESSAGE : message;
}
