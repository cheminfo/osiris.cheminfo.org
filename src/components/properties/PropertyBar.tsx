/**
 * One property's bar: a track, a fill whose colour is how good the value is,
 * and the published rule of thumb marked on it.
 *
 * The colour is handed to the stylesheet as a number rather than mixed here.
 * A ramp computed in JavaScript would be a hex code in a component, which is
 * the one thing a site of this family may not write: the green, the amber and
 * the red are the shared status tokens, and `properties.css` mixes them.
 *
 * The bar carries no accessible text of its own. It draws the same number the
 * row already prints beside it, so announcing it twice would only make the
 * panel longer to listen to.
 */

import type { CSSProperties, ReactElement } from 'react';

import type { BarGeometry } from './barGeometry.ts';

/** What {@link PropertyBar} needs. */
export interface PropertyBarProps {
  /** Where the fill and the mark go, from `barGeometry`. */
  geometry: BarGeometry;
}

/**
 * Draw one property's bar.
 * @param props - See {@link PropertyBarProps}.
 * @returns The track, its fill and its labelled mark.
 */
export function PropertyBar(props: PropertyBarProps): ReactElement {
  const { geometry } = props;
  // `--fitness` is a custom property, which React sets verbatim and
  // `CSSProperties` has no name for; the stylesheet reads it in the `calc()`
  // that mixes the ramp.
  const fill = {
    left: percent(geometry.start),
    width: percent(geometry.length),
    '--fitness': geometry.fitness.toFixed(4),
  } as CSSProperties;

  return (
    <div className="property-bar" aria-hidden="true">
      <div className="property-bar__track">
        {geometry.origin === 0 ? null : (
          <div
            className="property-bar__origin"
            style={{ left: percent(geometry.origin) }}
          />
        )}
        <div className="property-bar__fill" style={fill} />
        {geometry.mark === null ? null : (
          <div
            className="property-bar__mark"
            style={{ left: percent(geometry.mark) }}
          />
        )}
      </div>
      {geometry.mark === null || geometry.markLabel === null ? null : (
        <span
          className="property-bar__threshold"
          style={{ left: percent(geometry.mark) }}
        >
          {geometry.markLabel}
        </span>
      )}
    </div>
  );
}

/**
 * A fraction of the track, as a CSS length.
 * @param fraction - 0 at the left end, 1 at the right.
 * @returns The percentage, to two decimals.
 */
function percent(fraction: number): string {
  return `${(fraction * 100).toFixed(2)}%`;
}
