/**
 * What the plot draws, and what its colours mean.
 *
 * The columns are a row of capsules rather than a menu: fourteen of them fit on
 * two lines, and a reader comparing sets wants to see at a glance which ones
 * are in. The ramp is picked by looking at it, from the family's own scales —
 * never a hand-rolled `hsl()`, which is what the original explorer used and
 * what made its rows unreadable in print.
 */

import { HTMLSelect } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import type { ColorScale } from 'react-cheminfo/core';
import { ColorScaleLegend, ColorScaleSelect } from 'react-cheminfo/ui';

import type { AxisKey } from './compareAxes.ts';
import { AXIS_KEYS, axisLabel } from './compareAxes.ts';

/** What {@link ComparePlotControls} needs. */
export interface ComparePlotControlsProps {
  /** Which columns are drawn. */
  axisKeys: readonly AxisKey[];
  /** Called with the columns to draw instead. */
  onAxisKeys: (keys: readonly AxisKey[]) => void;
  /** Which column the lines are coloured by. */
  colorKey: AxisKey;
  /** Called with the column to colour by instead. */
  onColorKey: (key: AxisKey) => void;
  /** The two ends of the colour ramp, in that column's own units. */
  extent: { min: number; max: number };
  /** The ramp. */
  scale: ColorScale;
  /** The named scale in force, as the picker writes it. */
  scaleId: string;
  /** Called with the scale the reader chose. */
  onScaleId: (id: string) => void;
}

/**
 * The column capsules, the colour picker and the legend.
 * @param props - See {@link ComparePlotControlsProps}.
 * @returns The controls above the figure.
 */
export function ComparePlotControls(
  props: ComparePlotControlsProps,
): ReactElement {
  const { axisKeys, onAxisKeys, colorKey, onColorKey, extent, scale } = props;
  const { scaleId, onScaleId } = props;

  return (
    <div className="compare-controls">
      <div className="compare-axis-tags">
        {AXIS_KEYS.map((key) => {
          const drawn = axisKeys.includes(key);
          return (
            <button
              key={key}
              type="button"
              className="axis-tag"
              data-active={drawn}
              aria-pressed={drawn}
              onClick={() => {
                onAxisKeys(
                  drawn
                    ? axisKeys.filter((drawnKey) => drawnKey !== key)
                    : [...axisKeys, key],
                );
              }}
            >
              {axisLabel(key)}
            </button>
          );
        })}
      </div>

      <div className="compare-color">
        <label className="compare-color__label" htmlFor="compare-color-by">
          Colour by
        </label>
        <HTMLSelect
          id="compare-color-by"
          value={colorKey}
          onChange={(event) => {
            onColorKey(event.currentTarget.value as AxisKey);
          }}
        >
          {AXIS_KEYS.map((key) => (
            <option key={key} value={key}>
              {axisLabel(key)}
            </option>
          ))}
        </HTMLSelect>
        <ColorScaleSelect value={scaleId} onChange={onScaleId} />
        <ColorScaleLegend
          className="compare-legend"
          scale={scale}
          min={extent.min}
          max={extent.max}
          label={axisLabel(colorKey)}
        />
      </div>
    </div>
  );
}
