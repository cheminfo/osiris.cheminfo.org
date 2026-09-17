/**
 * The scale every displayed property is read on: how wide the bar is, where
 * the good band sits, and which published number the labelled mark names.
 *
 * Eight of the ten come verbatim from DataWarrior's own `MolecularPropertyHelper.SPEC`
 * table — the same ranges its own property views draw — so nothing here is a
 * cut-off picked to look right. The two it has no entry for, drug-likeness and
 * the drug score, keep the legacy explorer's ranges, and take their fitness
 * from `DrugScoreCalculator`'s own terms rather than from a new guess.
 *
 * The preferred band and the published threshold are different numbers on
 * purpose: cLogP's band closes at 4, where DataWarrior puts it, while the
 * published rule of thumb the mark names is 5. The band draws the colour, the
 * threshold draws the line.
 */

import type { PropertyKey } from './propertyKeys.ts';

/** A published rule of thumb, drawn on the bar as a labelled mark. */
export interface PropertyThreshold {
  /** Where on the bar the mark goes. */
  value: number;
  /** How it reads, e.g. `≤ 5`. */
  label: string;
}

/** Where a shared scale's numbers come from. */
export type ScaleSource = 'datawarrior' | 'legacy';

/** How one property is drawn, ranged and judged. */
export interface PropertyScale {
  /** The field of `OsirisProperties` this describes. */
  key: PropertyKey;
  /** What the panel and the table column call it. */
  label: string;
  /** The unit, empty where the quantity is dimensionless. */
  unit: string;
  /** Decimals the value is shown to; `0` for a count. */
  decimals: number;
  /** The left end of the bar, and of the plot axis. */
  rangeMin: number;
  /** The right end of the bar, and of the plot axis. */
  rangeMax: number;
  /** The bottom of the preferred band, or `null` when it has no lower bound. */
  preferredMin: number | null;
  /** The top of the preferred band, or `null` when it has no upper bound. */
  preferredMax: number | null;
  /**
   * How far outside the band the fitness takes to fall away. `null` for a
   * quantity that is already a 0-to-1 fitness.
   */
  halfWidth: number | null;
  /**
   * Whether a larger number is the better one. `null` where the property has a
   * band rather than a direction — a molecule wants some stereocentres, not as
   * many or as few as possible.
   */
  higherIsBetter: boolean | null;
  /** The published rule of thumb to mark, or `null` where there is none. */
  threshold: PropertyThreshold | null;
  /** Whether the bar grows from the middle rather than from the left. */
  diverging: boolean;
  /** Where the range and the band came from. */
  source: ScaleSource;
}

/** How each displayed property is drawn, ranged and judged. */
export const PROPERTY_SCALES: Record<PropertyKey, PropertyScale> = {
  logP: {
    key: 'logP',
    label: 'cLogP',
    unit: '',
    decimals: 2,
    rangeMin: 0,
    rangeMax: 8,
    preferredMin: null,
    preferredMax: 4,
    halfWidth: 0.5,
    higherIsBetter: false,
    threshold: { value: 5, label: '≤ 5' },
    diverging: false,
    source: 'datawarrior',
  },
  logS: {
    key: 'logS',
    label: 'Solubility',
    unit: 'log(mol/L)',
    decimals: 2,
    rangeMin: -8,
    rangeMax: 2,
    preferredMin: -4,
    preferredMax: null,
    halfWidth: 0.5,
    higherIsBetter: true,
    threshold: { value: -4, label: '> −4' },
    diverging: false,
    source: 'datawarrior',
  },
  molecularWeight: {
    key: 'molecularWeight',
    label: 'Molweight',
    unit: 'g/mol',
    decimals: 2,
    rangeMin: 0,
    rangeMax: 800,
    preferredMin: null,
    preferredMax: 400,
    halfWidth: 50,
    higherIsBetter: false,
    threshold: { value: 450, label: '< 450' },
    diverging: false,
    source: 'datawarrior',
  },
  polarSurfaceArea: {
    key: 'polarSurfaceArea',
    label: 'TPSA',
    unit: 'Å²',
    decimals: 2,
    rangeMin: 0,
    rangeMax: 250,
    preferredMin: null,
    preferredMax: 120,
    halfWidth: 20,
    higherIsBetter: false,
    threshold: null,
    diverging: false,
    source: 'datawarrior',
  },
  druglikeness: {
    key: 'druglikeness',
    label: 'Druglikeness',
    unit: '',
    decimals: 2,
    rangeMin: -10,
    rangeMax: 10,
    preferredMin: 0,
    preferredMax: null,
    // `DrugScoreCalculator` scores drug-likeness as 1/(1+e^-d), which is this
    // same valuation with a lower bound of 0 and a half-width of 1. So the
    // ramp behind the bar is the library's own term, not a second opinion.
    halfWidth: 1,
    higherIsBetter: true,
    threshold: { value: 0, label: '> 0' },
    diverging: true,
    source: 'legacy',
  },
  acceptorCount: {
    key: 'acceptorCount',
    label: 'H-bond acceptors',
    unit: '',
    decimals: 0,
    rangeMin: 0,
    rangeMax: 16,
    preferredMin: null,
    preferredMax: 10,
    halfWidth: 1,
    higherIsBetter: false,
    threshold: null,
    diverging: false,
    source: 'datawarrior',
  },
  donorCount: {
    key: 'donorCount',
    label: 'H-bond donors',
    unit: '',
    decimals: 0,
    rangeMin: 0,
    rangeMax: 8,
    preferredMin: null,
    preferredMax: 5,
    halfWidth: 0.5,
    higherIsBetter: false,
    threshold: null,
    diverging: false,
    source: 'datawarrior',
  },
  stereoCenterCount: {
    key: 'stereoCenterCount',
    label: 'Stereocentres',
    unit: '',
    decimals: 0,
    rangeMin: 0,
    rangeMax: 8,
    preferredMin: 1,
    preferredMax: 3,
    halfWidth: 2,
    higherIsBetter: null,
    threshold: null,
    diverging: false,
    source: 'datawarrior',
  },
  rotatableBondCount: {
    key: 'rotatableBondCount',
    label: 'Rotatable bonds',
    unit: '',
    decimals: 0,
    rangeMin: 0,
    rangeMax: 20,
    preferredMin: null,
    preferredMax: 4,
    halfWidth: 5,
    higherIsBetter: false,
    threshold: null,
    diverging: false,
    source: 'datawarrior',
  },
  drugScore: {
    key: 'drugScore',
    label: 'Drug score',
    unit: '',
    decimals: 2,
    // The legacy bar, kept: it grows from the middle and runs -1 to 1, so a
    // score always sits in its right half. The quantity itself is a product of
    // terms in (0.5, 1) and four risk factors, so it cannot leave (0, 1).
    rangeMin: -1,
    rangeMax: 1,
    preferredMin: null,
    preferredMax: null,
    // Already a 0-to-1 fitness: it is the product of the four valuations
    // `DrugScoreCalculator` computes, so valuing it again would square it.
    halfWidth: null,
    higherIsBetter: true,
    threshold: null,
    diverging: true,
    source: 'legacy',
  },
};

/**
 * How one property is drawn, ranged and judged.
 * @param key - Which of the ten.
 * @returns Its scale.
 */
export function propertyScale(key: PropertyKey): PropertyScale {
  return PROPERTY_SCALES[key];
}
