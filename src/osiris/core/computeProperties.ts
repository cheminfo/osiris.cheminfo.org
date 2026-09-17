/**
 * Everything the tool predicts about one molecule, in one pass.
 *
 * The order of the reads is not arbitrary. `MoleculeProperties`' constructor
 * normalises ambiguous bonds on the molecule it is handed, so the work is done
 * on a copy and the caller's molecule — the one the editor is still drawing —
 * is never touched. Its fields are prototype getters that rerun the whole
 * predictor on every read, at 13 µs each, and the object cannot be spread or
 * serialised at all, so each field is read exactly once into a plain object,
 * and that plain object is what crosses the worker boundary.
 *
 * Nothing here trusts OpenChemLib to fail loudly. An empty molecule answers a
 * full set of innocent numbers and a drug score of 0.63; a failed predictor
 * answers -999, -1 or 0, never `NaN`; and `DrugScoreCalculator` consumes every
 * one of those and returns something plausible. So the empty molecule is
 * refused first, every sentinel becomes `null`, and a drug score is computed
 * only when all of its inputs are real.
 */

import type * as OCL from 'openchemlib';

import {
  NO_FRAGMENT_MATCHED,
  RISK_TYPE_CODES,
  UNKNOWN_NUMBER,
  UNKNOWN_SURFACE_AREA,
  riskCodeOf,
  riskLevelOf,
} from './constants.ts';
import type { OsirisPredictors } from './predictors.ts';
import type { OsirisProperties, RiskLevel, RiskType } from './types.ts';
import { RISK_TYPES } from './types.ts';

/** What a caller knows about the molecule that the molecule does not. */
export interface ComputePropertiesOptions {
  /**
   * The name the source carried. The canonical SMILES is used when there is
   * none, so a row always has something to be called.
   * @default the canonical SMILES
   */
  label?: string;
}

/** A structure with no atoms, which has nothing to predict. */
export const EMPTY_MOLECULE_MESSAGE =
  'This structure has no atoms, so there is nothing to predict.';

/**
 * Predict everything the tool shows for one molecule.
 * @param molecule - The molecule. It is copied before anything touches it, so the caller keeps it exactly as it was.
 * @param predictors - OpenChemLib with its resources registered and checked.
 * @param options - See {@link ComputePropertiesOptions}.
 * @returns The ten numbers, the four risks, and what to call the molecule.
 * @throws {Error} When the molecule has no atoms.
 */
export function computeProperties(
  molecule: OCL.Molecule,
  predictors: OsirisPredictors,
  options: ComputePropertiesOptions = {},
): OsirisProperties {
  if (molecule.getAllAtoms() === 0) throw new Error(EMPTY_MOLECULE_MESSAGE);

  const working = molecule.getCompactCopy();
  const idCode = working.getIDCode();
  const smiles = working.toIsomericSmiles();
  const { formula, relativeWeight } = working.getMolecularFormula();

  const properties = new predictors.MoleculeProperties(working);
  const logP = real(properties.logP, UNKNOWN_NUMBER);
  const logS = real(properties.logS, UNKNOWN_NUMBER);
  const polarSurfaceArea = real(
    properties.polarSurfaceArea,
    UNKNOWN_SURFACE_AREA,
  );
  const acceptorCount = properties.acceptorCount;
  const donorCount = properties.donorCount;
  const stereoCenterCount = properties.stereoCenterCount;
  const rotatableBondCount = properties.rotatableBondCount;

  const assessed = predictors.druglikeness.assessDruglikeness(working);
  const druglikeness =
    assessed === UNKNOWN_NUMBER || assessed === NO_FRAGMENT_MATCHED
      ? null
      : assessed;

  const risks = assessRisks(working, predictors);

  return {
    idCode,
    smiles,
    label: options.label ?? smiles,
    molecularFormula: formula,
    molecularWeight: relativeWeight,
    logP,
    logS,
    polarSurfaceArea,
    druglikeness,
    drugScore: drugScore(predictors, {
      logP,
      logS,
      relativeWeight,
      druglikeness,
      risks,
    }),
    acceptorCount,
    donorCount,
    stereoCenterCount,
    rotatableBondCount,
    risks,
  };
}

function assessRisks(
  molecule: OCL.Molecule,
  predictors: OsirisPredictors,
): Record<RiskType, RiskLevel> {
  const risks = {} as Record<RiskType, RiskLevel>;
  for (const risk of RISK_TYPES) {
    risks[risk] = riskLevelOf(
      predictors.toxicity.assessRisk(molecule, RISK_TYPE_CODES[risk]),
    );
  }
  return risks;
}

interface DrugScoreInputs {
  logP: number | null;
  logS: number | null;
  relativeWeight: number;
  druglikeness: number | null;
  risks: Record<RiskType, RiskLevel>;
}

/**
 * The drug score, or `null` when any of its five inputs was unknown.
 *
 * `calculate` never refuses: a drug-likeness of -999 simply makes that factor
 * exactly 0.5 and the score comes back looking ordinary, and an unassessed risk
 * applies no penalty where a high one would have applied 0.6. Both read as good
 * news, which is why they are refused here instead.
 *
 * The second argument is the **solubility**. The legacy explorer passed the
 * polar surface area, which is a different number in a different unit; see the
 * test that pins both.
 */
function drugScore(
  predictors: OsirisPredictors,
  inputs: DrugScoreInputs,
): number | null {
  const { logP, logS, relativeWeight, druglikeness, risks } = inputs;
  if (logP === null || logS === null || druglikeness === null) return null;

  const codes: number[] = [];
  for (const risk of RISK_TYPES) {
    const level = risks[risk];
    if (level === 'unknown') return null;
    codes.push(riskCodeOf(level));
  }

  return predictors.DrugScoreCalculator.calculate(
    logP,
    logS,
    relativeWeight,
    druglikeness,
    codes,
  );
}

function real(value: number, sentinel: number): number | null {
  if (value === sentinel || !Number.isFinite(value)) return null;
  return value;
}
