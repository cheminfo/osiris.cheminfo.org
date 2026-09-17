/**
 * DataWarrior's own fuzzy fitness, ported from
 * `com.actelion.research.chem.prediction.MolecularPropertyHelper`.
 *
 * It is what turns a predicted number into the green-to-red ramp behind it,
 * and it is the library's arithmetic rather than a cut-off invented here: a
 * property inside its preferred band scores 1, and the score falls away
 * smoothly outside it over `halfWidth`. There is no cliff anywhere, so a cLogP
 * of 4.01 does not look categorically worse than one of 3.99.
 */

/**
 * How well one value sits in a preferred band, from 0 to 1.
 *
 * A bound given as `null` is simply not applied, which is how a property
 * bounded on one side only — a solubility that must be high enough, a weight
 * that must be low enough — scores against the one bound it has. The original
 * passes `Double.NaN` for an absent bound and `NaN` is accepted here too.
 *
 * The Java comment claims the fitness at `max + halfWidth` is `1/e`; the
 * arithmetic gives `1/(1+e)`, and the arithmetic is what was ported.
 * @param value - The predicted number.
 * @param min - The bottom of the preferred band, or `null` when there is none.
 * @param max - The top of the preferred band, or `null` when there is none.
 * @param halfWidth - How far outside the band the score takes to fall away.
 * @returns The fitness, or `NaN` when the value is `NaN`.
 */
export function getValuation(
  value: number,
  min: number | null,
  max: number | null,
  halfWidth: number,
): number {
  if (Number.isNaN(value)) return Number.NaN;

  let v = 1;
  if (min !== null && !Number.isNaN(min)) {
    v *= 1 / (1 + Math.exp((min - value) / halfWidth));
  }
  if (max !== null && !Number.isNaN(max)) {
    v *= 1 / (1 + Math.exp((value - max) / halfWidth));
  }
  return v;
}
