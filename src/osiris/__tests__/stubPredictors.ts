/**
 * Predictors that answer OpenChemLib's sentinels on demand.
 *
 * -999, -1 and 0 are what the library returns instead of failing, and none of
 * them is `NaN`. They are close to impossible to provoke with a real molecule,
 * so they are injected here instead: the guards that turn them into `null` and
 * refuse a drug score are exactly the part a wrong answer would slip through.
 */

import type * as OCL from 'openchemlib';

import type { OsirisPredictors } from '../core/index.ts';

/** Which sentinel to answer with. */
export interface SentinelOverrides {
  /** cLogP answers this instead. */
  logP?: number;
  /** Solubility answers this instead. */
  logS?: number;
  /** The polar surface area answers this instead. */
  polarSurfaceArea?: number;
  /** Drug-likeness answers this instead. */
  druglikeness?: number;
  /** Every risk answers this instead. */
  risk?: number;
}

/**
 * The real predictors, with the named quantities replaced by a sentinel.
 * @param real - The registered predictors.
 * @param overrides - See {@link SentinelOverrides}.
 * @returns Predictors that answer the sentinels.
 */
export function sentinelPredictors(
  real: OsirisPredictors,
  overrides: SentinelOverrides,
): OsirisPredictors {
  class Stubbed {
    logP: number;
    logS: number;
    polarSurfaceArea: number;
    acceptorCount: number;
    donorCount: number;
    stereoCenterCount: number;
    rotatableBondCount: number;

    constructor(molecule: OCL.Molecule) {
      const actual = new real.MoleculeProperties(molecule);
      this.logP = overrides.logP ?? actual.logP;
      this.logS = overrides.logS ?? actual.logS;
      this.polarSurfaceArea =
        overrides.polarSurfaceArea ?? actual.polarSurfaceArea;
      this.acceptorCount = actual.acceptorCount;
      this.donorCount = actual.donorCount;
      this.stereoCenterCount = actual.stereoCenterCount;
      this.rotatableBondCount = actual.rotatableBondCount;
    }
  }

  return {
    ...real,
    MoleculeProperties: Stubbed as unknown as typeof OCL.MoleculeProperties,
    druglikeness: {
      assessDruglikeness: (molecule: OCL.Molecule) =>
        overrides.druglikeness ??
        real.druglikeness.assessDruglikeness(molecule),
    } as unknown as OCL.DruglikenessPredictor,
    toxicity: {
      assessRisk: (molecule: OCL.Molecule, riskType: number) =>
        overrides.risk ?? real.toxicity.assessRisk(molecule, riskType),
    } as unknown as OCL.ToxicityPredictor,
  };
}
