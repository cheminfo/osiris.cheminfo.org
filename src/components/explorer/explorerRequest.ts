/**
 * What the explorer has to do with the structure its state holds.
 *
 * Two signals describe one molecule, and which of them is filled in depends on
 * where it came from. The pen writes both: an idCode with its atom layout, and
 * the canonical SMILES. A link carrying `?smiles=` writes only the second, so
 * the page has a name for a molecule and not the molecule — and every predictor
 * takes an idCode. A link carrying `?idcode=` writes only the first.
 *
 * So the page asks this function what state it is in, and there are exactly
 * three answers: there is nothing to show, there is a structure to predict, or
 * there is a SMILES that has to be read into one first. Deciding it here rather
 * than in the page keeps it a pure function, testable with no DOM and no
 * openchemlib.
 *
 * The idCode wins whenever both are known: it is the exact structure, where a
 * SMILES has still to be parsed and may not come back the same molecule.
 */

import { isEmptyIdCode, splitIdCode } from 'react-cheminfo/core';

import type { RiskType } from '../../osiris/index.ts';
import { RISK_TYPES } from '../../osiris/index.ts';

/** A structure the page can draw and predict straight away. */
export interface ExplorerStructure {
  /** The canonical idCode, with no coordinates on it. */
  idCode: string;
  /**
   * The atom layout the editor or the reader laid out. Empty when none is
   * known, in which case openchemlib invents one.
   */
  coordinates: string;
}

/** What the explorer has to do next. */
export type ExplorerRequest =
  | { kind: 'empty' }
  | { kind: 'resolve'; smiles: string }
  | { kind: 'ready'; structure: ExplorerStructure };

/**
 * Read the explorer's two structure signals into one instruction.
 * @param editorValue - `state.view.explorer.idCode`: an idCode, with the coordinates after a space, or empty.
 * @param linkedSmiles - `state.view.explorer.smiles`: the SMILES a link named, or empty.
 * @returns Nothing to show, a structure to predict, or a SMILES to read first.
 */
export function explorerRequest(
  editorValue: string,
  linkedSmiles: string,
): ExplorerRequest {
  const { idCode, coordinates } = splitIdCode(editorValue);
  // An erased canvas is not an empty string: it is the idCode of the molecule
  // with no atoms, which every predictor answers with innocent values.
  if (idCode !== '' && !isEmptyIdCode(idCode)) {
    return {
      kind: 'ready',
      structure: { idCode, coordinates: coordinates ?? '' },
    };
  }

  const smiles = linkedSmiles.trim();
  if (smiles === '') return { kind: 'empty' };
  return { kind: 'resolve', smiles };
}

/**
 * The value the editor is mounted with, and the molecule the risk explanations
 * are located on: the idCode with its layout after a space, as openchemlib
 * writes the pair.
 * @param structure - The structure the page settled on.
 * @returns The idCode, with the coordinates after a space when there are any.
 */
export function structureValue(structure: ExplorerStructure): string {
  const { idCode, coordinates } = structure;
  return coordinates === '' ? idCode : `${idCode} ${coordinates}`;
}

/**
 * The open risk, as one of the four the tool assesses.
 *
 * The state holds it as a plain string, because the shell that owns the state
 * does not know the prediction domain. Anything else — a stale value, an
 * address edited by hand — closes the explanation rather than opening one for a
 * risk that does not exist.
 * @param value - What `state.view.explorer.openRisk` holds.
 * @returns The risk, or `null`.
 */
export function asRiskType(value: string | null): RiskType | null {
  if (value === null) return null;
  return (RISK_TYPES as readonly string[]).includes(value)
    ? (value as RiskType)
    : null;
}
