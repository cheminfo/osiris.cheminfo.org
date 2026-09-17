/**
 * Deciding what the reader was given, without asking.
 *
 * The answer is in the text: an SD file ends every record with `$$$$`, and a
 * molfile carries a counts line stamped with its dialect. Anything else is a
 * list of line notations, which is what a chemist pastes.
 */

import { looksLikeMolfile } from 'react-cheminfo/core';

import type { InputFormat } from './types.ts';

/**
 * Decide which notation a piece of input is written in.
 * @param text - Whatever was pasted, dropped or fetched.
 * @returns `sdf` for an SD file or a single molfile, `smiles` for a list, `empty` for nothing.
 */
export function detectFormat(text: string): InputFormat {
  if (text.trim() === '') return 'empty';
  if (RECORD_SEPARATOR.test(text)) return 'sdf';
  return looksLikeMolfile(text) ? 'sdf' : 'smiles';
}

/** The end of an SD record, alone on its line. */
const RECORD_SEPARATOR = /^\$\$\$\$[^\S\n]*$/m;
