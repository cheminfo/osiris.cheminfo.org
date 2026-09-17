/**
 * Reading a dropped or chosen file.
 *
 * The bytes are decoded, never `file.text()`: that one reads every file as
 * UTF-8, so a latin1 SD file — which is most of them — comes back with a
 * mojibaked name in every row, and a byte-order mark is left on the first line
 * where it breaks the record that follows it.
 */

import { emptyResult, readMolecules } from './readMolecules.ts';
import type { ReadOptions, ReadResult } from './types.ts';

export { ACCEPTED_FILES } from './acceptedFiles.ts';

/**
 * Read a file the reader dropped or chose.
 * @param file - The file, whatever its extension says it is.
 * @param options - See {@link ReadOptions}.
 * @returns The molecules, what could not be read, and how the file was written.
 */
export async function readMoleculeFile(
  file: File,
  options: ReadOptions = {},
): Promise<ReadResult> {
  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return {
      ...emptyResult(),
      problems: [
        { line: 1, text: file.name, reason: 'This file could not be read.' },
      ],
    };
  }
  return readMolecules(new Uint8Array(bytes), options);
}
