/**
 * The numbers OpenChemLib speaks, and the words this site says instead.
 *
 * Two translations live here and nowhere else. The first is the library's risk
 * numbering, which is easy to get backwards: `ToxicityPredictor.RISK_NAMES` is
 * indexed by risk *type*, not by risk *level*, and the library exports no level
 * names at all — so reading a level out of `RISK_NAMES` gives a confident,
 * wrong answer. The second is the set of sentinels every predictor returns
 * instead of failing: none of them is `NaN`, and `DrugScoreCalculator` consumes
 * every one of them and hands back a plausible number.
 */

import type { RiskLevel, RiskType } from './types.ts';

/**
 * Where each risk sits in the library's numbering — `TYPE_MUTAGENIC` 0 through
 * `TYPE_REPRODUCTIVE_EFFECTIVE` 3. It is also the order `DrugScoreCalculator`
 * expects its `toxRisks` array in.
 */
export const RISK_TYPE_CODES: Record<RiskType, number> = {
  mutagenic: 0,
  tumorigenic: 1,
  irritant: 2,
  reproductive: 3,
};

/**
 * What `assessRisk` returns, read as a word: `RISK_UNKNOWN` 0, `RISK_NO` 1,
 * `RISK_LOW` 2, `RISK_HIGH` 3.
 */
export const RISK_LEVELS: readonly RiskLevel[] = [
  'unknown',
  'none',
  'low',
  'high',
];

/**
 * What the library calls each risk, matching `ToxicityPredictor.RISK_NAMES`.
 * Written out here so reading a label costs no import of a megabyte of
 * OpenChemLib on a page that only draws a table.
 */
export const RISK_LABELS: Record<RiskType, string> = {
  mutagenic: 'Mutagenicity',
  tumorigenic: 'Tumorigenicity',
  irritant: 'Irritating effects',
  reproductive: 'Reproductive effects',
};

/**
 * How each level reads on screen. OSIRIS's own three words, plus one for the
 * state where the tables did not load — which is not "no risk" and must never
 * be shown as one.
 */
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  unknown: 'Not assessed',
  none: 'No risk',
  low: 'Medium risk',
  high: 'High risk',
};

/**
 * What each level multiplies the drug score by, decoded from
 * `DrugScoreCalculator.calculate`. `unknown` applies no factor at all, which is
 * why a score is refused rather than shown when a risk came back unassessed.
 */
export const DRUG_SCORE_RISK_FACTORS: Record<RiskLevel, number> = {
  unknown: 1,
  none: 1,
  low: 0.8,
  high: 0.6,
};

/**
 * What cLogP, solubility and drug-likeness answer when the predictor failed
 * outright. `CLogPPredictor` returns it on an internal exception, and both
 * `SolubilityPredictor.cSolubilityUnknown` and
 * `DruglikenessPredictor.DRUGLIKENESS_UNKNOWN` are this value.
 */
export const UNKNOWN_NUMBER = -999;

/** What the polar surface area answers when it is unknown — not `-999`. */
export const UNKNOWN_SURFACE_AREA = -1;

/**
 * What `assessDruglikeness` answers when the molecule matched none of the 5294
 * fragments. It is a real return value, not a failure, and it is
 * indistinguishable from a drug-likeness that happens to be exactly -1.
 */
export const NO_FRAGMENT_MATCHED = -1;

/**
 * The word for a risk the library answered with a number.
 * @param code - What `assessRisk` returned, 0 to 3.
 * @returns The level, `unknown` for anything outside the four the library defines.
 */
export function riskLevelOf(code: number): RiskLevel {
  return RISK_LEVELS[code] ?? 'unknown';
}

/**
 * The number the library uses for a level, for the `toxRisks` argument of
 * `DrugScoreCalculator.calculate`.
 * @param level - The level.
 * @returns 0 to 3.
 */
export function riskCodeOf(level: RiskLevel): number {
  const code = RISK_LEVELS.indexOf(level);
  return code === -1 ? 0 : code;
}
