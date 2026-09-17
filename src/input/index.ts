/**
 * Turning whatever the reader gives us into a list of molecules.
 *
 * Three doors, one shape: a file, a pasted or linked text, and the structure
 * on the canvas all come back as a {@link ReadResult}, so a page merges them
 * the same way with {@link appendMolecules} and shows what failed with
 * {@link problemLines}. Nothing here throws on what a reader supplies, and
 * nothing here holds a molecule object.
 */

export { ACCEPTED_FILES } from './acceptedFiles.ts';
export type { AppendOptions, AppendResult } from './appendMolecules.ts';
export { appendMolecules } from './appendMolecules.ts';
export { detectFormat } from './detectFormat.ts';
export type { DrawnStructure } from './drawnMolecule.ts';
export { readDrawnMolecule } from './drawnMolecule.ts';
export {
  NO_ATOMS_MESSAGE,
  QUERY_MESSAGE,
  UNREADABLE_MESSAGE,
  readableError,
} from './errors.ts';
export {
  NAME_FIELDS,
  nameFieldsOf,
  shortenLabel,
  titleLine,
} from './labels.ts';
export type { StructureIdentity } from './molecule.ts';
export {
  describeMolecule,
  moleculeFromIdCode,
  moleculeFromStructure,
} from './molecule.ts';
export type { MoleculeInput } from './readMolecules.ts';
export { emptyResult, readMolecules } from './readMolecules.ts';
export { readMoleculeFile } from './readMoleculeFile.ts';
export { readSdfRecords } from './readSdfRecords.ts';
export type { RowInput } from './rows.ts';
export { formatProblem, moleculeRow, problemLines, rowKey } from './rows.ts';
export { splitSmilesList } from './splitSmilesList.ts';
export type {
  InputEntry,
  InputFormat,
  InputProblem,
  MoleculeRow,
  ReadFormat,
  ReadOptions,
  ReadResult,
  SplitResult,
} from './types.ts';
