/**
 * Rows and predictions the comparison tests are written against.
 *
 * Plain objects: what is under test here is the page's own arithmetic — which
 * axis a value lands on, which rows a brush keeps, what a file says — and none
 * of it should need OpenChemLib to answer.
 */

import type { OsirisProperties } from '../../../osiris/index.ts';
import type { MoleculeRow } from '../../../state/index.ts';

/** One row of a set, with only what the test cares about spelled out. */
export function row(
  overrides: Partial<MoleculeRow> & { key: string },
): MoleculeRow {
  return {
    idCode: `id-${overrides.key}`,
    coordinates: '',
    smiles: 'CCO',
    label: overrides.key,
    duplicateOf: null,
    ...overrides,
  };
}

/** A full prediction, with only what the test cares about spelled out. */
export function properties(
  overrides: Partial<OsirisProperties> = {},
): OsirisProperties {
  return {
    idCode: 'id-a',
    smiles: 'CCO',
    label: 'ethanol',
    molecularFormula: 'C2H6O',
    molecularWeight: 46.07,
    logP: -0.13,
    logS: 0.51,
    polarSurfaceArea: 20.23,
    druglikeness: -5.79,
    drugScore: 0.37,
    acceptorCount: 1,
    donorCount: 1,
    stereoCenterCount: 0,
    rotatableBondCount: 0,
    risks: {
      mutagenic: 'none',
      tumorigenic: 'none',
      irritant: 'low',
      reproductive: 'high',
    },
    ...overrides,
  };
}
