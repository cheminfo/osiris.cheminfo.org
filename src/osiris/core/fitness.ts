/**
 * How good one predicted number is, from 0 to 1, and where it sits on its bar.
 *
 * The fitness is what the green-to-red ramp reads; the position is what the
 * bar's length reads. They are deliberately two numbers: a molecular weight of
 * 780 is nearly the full width of its bar and nearly the worst fitness, while
 * a drug-likeness of 0 is halfway along its bar and exactly half fit.
 */

import { clamp } from 'react-cheminfo/core';

import type { PropertyKey } from './propertyKeys.ts';
import { propertyScale } from './scales.ts';
import { getValuation } from './valuation.ts';

/**
 * How well a value sits in its property's preferred band, from 0 (as bad as
 * the ramp goes) to 1 (inside the band).
 *
 * The drug score is already that fitness — it is the product of the four
 * valuations `DrugScoreCalculator` computes — so it is returned as it stands
 * rather than valued a second time.
 * @param key - Which of the ten properties.
 * @param value - The predicted number, or `null` when the predictor could not answer.
 * @returns The fitness, or `null` for an unknown value.
 */
export function propertyFitness(
  key: PropertyKey,
  value: number | null,
): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const scale = propertyScale(key);
  if (scale.halfWidth === null) return clamp(value, 0, 1);
  return getValuation(
    value,
    scale.preferredMin,
    scale.preferredMax,
    scale.halfWidth,
  );
}

/**
 * Where a value sits along its bar, from 0 at the left end to 1 at the right.
 *
 * Clamped, because a range is a typical spread rather than a bound: cholesterol
 * runs past the solubility axis and still has to draw.
 * @param key - Which of the ten properties.
 * @param value - The predicted number, or `null`.
 * @returns The position, or `null` for an unknown value.
 */
export function propertyPosition(
  key: PropertyKey,
  value: number | null,
): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const { rangeMin, rangeMax } = propertyScale(key);
  if (rangeMax === rangeMin) return 0;
  return clamp((value - rangeMin) / (rangeMax - rangeMin), 0, 1);
}
