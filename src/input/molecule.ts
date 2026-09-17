/**
 * Reading one structure, by the notation it is written in.
 *
 * Never `Molecule.fromText`: it falls back to decoding an idCode, and the
 * decoder reads arbitrary text as packed bits, so `zzz` comes back as a
 * 117-atom molecule. Each notation is read by the parser that belongs to it,
 * and an idCode is re-encoded and compared before it is believed.
 */

import { Molecule } from 'openchemlib';
import { readStructure, splitIdCode } from 'react-cheminfo/core';

import {
  NO_ATOMS_MESSAGE,
  QUERY_MESSAGE,
  UNREADABLE_MESSAGE,
} from './errors.ts';

/** What a molecule is carried as once it has been read. */
export interface StructureIdentity {
  /** The canonical identifier, and the key a duplicate is recognised by. */
  idCode: string;
  /**
   * The drawing: the layout the source carried, or the one openchemlib
   * invented while working out the stereo descriptors.
   */
  coordinates: string;
  /** The canonical SMILES, for the address and for a download. */
  smiles: string;
}

/**
 * Read one structure, whichever of the two notations it is written in.
 *
 * A SMILES is parsed without inventing coordinates, which is the cheaper half
 * of the work; {@link describeMolecule} then asks for the stereo descriptors,
 * and the drawing comes with them.
 * @param text - A molfile or a line notation, as it was written.
 * @returns The molecule.
 * @throws When the text is empty, is a query, holds no atom, or will not parse.
 */
export function moleculeFromStructure(text: string): Molecule {
  const { kind, value } = readStructure(text);
  if (kind === 'empty') throw new Error(NO_ATOMS_MESSAGE);
  if (kind === 'smarts') throw new Error(QUERY_MESSAGE);
  const molecule =
    kind === 'molfile'
      ? Molecule.fromMolfile(value)
      : Molecule.fromSmiles(value, { noCoordinates: true });
  return withAtoms(molecule);
}

/**
 * Read an idCode, with the atom layout an editor writes after it.
 *
 * The idCode is re-encoded and compared, because the decoder reads any text as
 * packed bits and answers with a molecule rather than with a failure.
 * @param value - An idCode, optionally followed by a space and its coordinates.
 * @returns The molecule.
 * @throws When the value holds no atom or does not encode the molecule it decodes to.
 */
export function moleculeFromIdCode(value: string): Molecule {
  const { idCode, coordinates } = splitIdCode(value);
  if (idCode === '') throw new Error(NO_ATOMS_MESSAGE);
  const molecule =
    coordinates === undefined || coordinates === ''
      ? Molecule.fromIDCode(idCode)
      : Molecule.fromIDCode(idCode, coordinates);
  if (molecule.getIDCode() !== idCode) throw new Error(UNREADABLE_MESSAGE);
  return withAtoms(molecule);
}

/**
 * Read off everything a row keeps about a molecule.
 *
 * A row never holds the molecule itself: ten thousand of them cost 198 MB,
 * against nothing at all for these three strings, and a visible row is built
 * back from the idCode in a quarter of a millisecond.
 *
 * The stereo descriptors are computed first, and cannot be skipped. A
 * molecule parsed from a SMILES without coordinates answers
 * `gGX\`BDdwMT@@` for either enantiomer of alanine — the idCode of the
 * molecule with no stereocentre — until they are asked for, so the two would
 * share a key and one of them would vanish from the set. Asking costs 53 µs
 * a molecule against 67 µs for a parse that invents the drawing up front, and
 * gives the same idCode and the same drawing as that parse does.
 * @param molecule - The molecule just read.
 * @returns Its idCode, its coordinates and its canonical SMILES.
 */
export function describeMolecule(molecule: Molecule): StructureIdentity {
  molecule.ensureHelperArrays(Molecule.cHelperCIP);
  const { idCode, coordinates } = molecule.getIDCodeAndCoordinates();
  return { idCode, coordinates, smiles: molecule.toIsomericSmiles() };
}

function withAtoms(molecule: Molecule): Molecule {
  // A record whose counts line declares nothing, and text that only looked
  // like a molfile, come back as a molecule with no atoms, not as a failure.
  if (molecule.getAllAtoms() === 0) throw new Error(NO_ATOMS_MESSAGE);
  return molecule;
}
