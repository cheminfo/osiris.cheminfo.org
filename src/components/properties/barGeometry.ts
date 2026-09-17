/**
 * Where a property's bar starts, how far it runs, and where its labelled mark
 * goes.
 *
 * Three numbers come out of the domain and are merely arranged here. The
 * **position** is how far along the scale the value sits and gives the bar its
 * length; the **fitness** is DataWarrior's own `getValuation`, a continuous
 * 0-to-1 score that the stylesheet reads as the green-to-red ramp; the
 * **threshold** is the published rule of thumb — cLogP ≤ 5, logS > −4,
 * molweight < 450, drug-likeness > 0 — drawn as a mark on the track.
 *
 * Nothing here invents a cut-off. A bar whose colour disagreed with the panel's
 * own scale record would be a second opinion nobody could trace.
 */

import type { PropertyKey } from '../../osiris/index.ts';
import {
  propertyFitness,
  propertyPosition,
  propertyScale,
} from '../../osiris/index.ts';

/** Where a bar's fill and its mark go, all as fractions of the track. */
export interface BarGeometry {
  /** Where the fill starts, 0 at the left end of the track and 1 at the right. */
  start: number;
  /** How much of the track the fill covers, 0 to 1. */
  length: number;
  /** How good the value is: 0 as bad as the ramp goes, 1 inside the preferred band. */
  fitness: number;
  /**
   * Where the fill grows from: the left end of the track, or its middle for a
   * quantity that runs either side of zero. Drawn as a tick, because a fill
   * that starts at a quarter of the way along says nothing without it.
   */
  origin: number;
  /** Where the published threshold is marked, or `null` where the property has none. */
  mark: number | null;
  /** How that threshold reads, e.g. `≤ 5`, or `null`. */
  markLabel: string | null;
}

/**
 * Where a diverging bar grows from: the middle of its own range, which is
 * drug-likeness 0 and drug score 0.
 */
const DIVERGING_ORIGIN = 0.5;

/**
 * Lay out one property's bar.
 * @param key - Which of the ten properties.
 * @param value - The predicted number, or `null` when the predictor could not answer.
 * @returns The geometry, or `null` when there is no bar to draw.
 */
export function barGeometry(
  key: PropertyKey,
  value: number | null,
): BarGeometry | null {
  const position = propertyPosition(key, value);
  if (position === null) return null;

  const scale = propertyScale(key);
  const origin = scale.diverging ? DIVERGING_ORIGIN : 0;
  const mark =
    scale.threshold === null
      ? null
      : propertyPosition(key, scale.threshold.value);

  return {
    start: Math.min(origin, position),
    length: Math.abs(position - origin),
    fitness: propertyFitness(key, value) ?? 0,
    origin,
    mark,
    markLabel: scale.threshold?.label ?? null,
  };
}
