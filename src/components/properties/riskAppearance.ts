/**
 * How one risk reads on screen: the word for it, and the tone its square takes.
 *
 * Three levels, and they are exactly the three `DrugScoreCalculator` multiplies
 * by — no risk ×1, medium ×0.8, high ×0.6 — so the colours say what the score
 * already counted. A fourth tone exists for the state the library calls
 * `RISK_UNKNOWN`, which means its tables did not load: it is grey, never green,
 * because "nothing was assessed" and "nothing was found" are different answers
 * and showing them alike is the one mistake that makes the panel dishonest.
 *
 * A fifth, `pending`, is ours: the prediction costs a fifth of a second and the
 * square is on screen before it comes back.
 */

import type { RiskLevel } from '../../osiris/index.ts';
import { RISK_LEVEL_LABELS } from '../../osiris/index.ts';

/** What a square is painted with, before the stylesheet turns it into a colour. */
export type RiskTone = 'pending' | 'unknown' | 'none' | 'low' | 'high';

/** How one risk is shown. */
export interface RiskAppearance {
  /** The stylesheet's `data-level`, which picks the square's colour. */
  tone: RiskTone;
  /** What the square says next to the risk's name, e.g. `High risk`. */
  label: string;
  /**
   * Whether the level is worth opening: an explanation exists for an assessed
   * risk and for nothing else.
   */
  explainable: boolean;
}

/** What a square says while its molecule is still being predicted. */
export const PENDING_RISK_LABEL = 'Predicting…';

/**
 * What a square says when there is no molecule to predict.
 *
 * The comparison page draws the panel before a row is picked, and a square that
 * said `Predicting…` there would claim work nobody asked for — under a heading
 * inviting the reader to pick a row, which is a plain contradiction.
 */
export const IDLE_RISK_LABEL = 'Not predicted yet';

/**
 * What the predictor's own page says about its alerts, word for word.
 *
 * Quoted rather than paraphrased: it is the sentence that stops a red square
 * being read as a verdict, and rewriting it would put our words over his.
 */
export const RISK_CAVEAT =
  'Toxicity risk alerts are by no means meant to be a fully reliable toxicity prediction. Nor should be concluded from the absence of risk alerts that a particular substance is completely free of any toxic effect.';

/**
 * What is said in place of a highlight when the compound's own idCode is on one
 * of the RTECS-derived lists. There is no fragment to point at, and painting the
 * whole molecule would call the compound its own toxicophore.
 */
export const KNOWN_MOLECULE_NOTE =
  'This exact compound is on the list, so there is no fragment to point at.';

/**
 * The tone and the word for one risk.
 * @param level - How the risk came back, or `undefined` when there is none yet.
 * @param pending - Whether a prediction is actually running for this molecule.
 * @default false
 * @returns See {@link RiskAppearance}.
 */
export function riskAppearance(
  level: RiskLevel | undefined,
  pending = false,
): RiskAppearance {
  if (level === undefined) {
    return {
      tone: 'pending',
      label: pending ? PENDING_RISK_LABEL : IDLE_RISK_LABEL,
      explainable: false,
    };
  }
  return {
    tone: level,
    label: RISK_LEVEL_LABELS[level],
    explainable: level !== 'unknown',
  };
}
