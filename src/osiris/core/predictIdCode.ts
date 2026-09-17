/**
 * Prediction from the only thing worth keeping per row.
 *
 * A row never holds an `OCL.Molecule` — ten thousand of them cost 198 MB — so
 * what travels to a worker is the idCode, and the molecule is rebuilt there in
 * a quarter of a millisecond against the 380 ms the prediction itself costs.
 */

import { splitIdCode } from 'react-cheminfo/core';

import type { ComputePropertiesOptions } from './computeProperties.ts';
import { computeProperties } from './computeProperties.ts';
import type { OsirisPredictors } from './predictors.ts';
import { riskDetail } from './riskDetail.ts';
import type { OsirisProperties, RiskDetail, RiskType } from './types.ts';

/**
 * What is said when an idCode cannot be read.
 *
 * An idCode is written by a program, not typed by a chemist, so there is no
 * position to point at and no parser reason worth repeating: OpenChemLib
 * answers a malformed one with `Cannot set properties of undefined`, which
 * names nothing anyone can act on. Worse, it does not always throw — `zzzz`
 * reads as a 117-atom molecule — so this is the floor, not the whole guard.
 */
export const UNREADABLE_ID_CODE_MESSAGE = 'This structure could not be read.';

/**
 * Predict everything the tool shows, from an idCode.
 * @param value - The idCode, with the editor's atom coordinates after a space or without them.
 * @param predictors - OpenChemLib with its resources registered and checked.
 * @param options - See {@link ComputePropertiesOptions}.
 * @returns The ten numbers, the four risks, and what to call the molecule.
 * @throws {Error} When the idCode cannot be read, or describes no atoms.
 */
export function predictIdCode(
  value: string,
  predictors: OsirisPredictors,
  options: ComputePropertiesOptions = {},
): OsirisProperties {
  return computeProperties(read(value, predictors), predictors, options);
}

/**
 * Why one risk came back as it did, from an idCode.
 * @param value - The idCode, coordinates included or not.
 * @param risk - Which of the four risks to explain.
 * @param predictors - OpenChemLib with its resources registered and checked.
 * @returns The findings, with the matched atoms and bonds of every fragment.
 * @throws {Error} When the idCode cannot be read.
 */
export function riskDetailOfIdCode(
  value: string,
  risk: RiskType,
  predictors: OsirisPredictors,
): RiskDetail {
  return riskDetail(read(value, predictors), risk, predictors);
}

function read(value: string, predictors: OsirisPredictors) {
  const { idCode, coordinates } = splitIdCode(value);
  try {
    return coordinates === undefined
      ? predictors.Molecule.fromIDCode(idCode)
      : predictors.Molecule.fromIDCode(idCode, coordinates);
  } catch (error) {
    throw new Error(UNREADABLE_ID_CODE_MESSAGE, { cause: error });
  }
}
