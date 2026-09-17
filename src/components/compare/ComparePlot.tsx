/**
 * One line per molecule, across the columns the reader chose.
 *
 * The figure is `react-cheminfo`'s: the axes, the brushes, the hit test and the
 * canvas are the family's, and what this file adds is which columns are drawn,
 * what the lines are coloured by, and the sentence saying how much of the set a
 * brush is keeping.
 *
 * Brushing reports on release, so the table under the plot is redrawn once per
 * gesture rather than sixty times a second, and it filters on the very same
 * mask the figure paints with. A molecule still being predicted has no point on
 * any axis, so it is simply not drawn yet — it never collapses onto a zero.
 */

import { Button, NonIdealState } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { useRef } from 'react';
import type {
  ColorScale,
  ParallelAxis,
  ParallelRange,
  ParallelRanges,
} from 'react-cheminfo/core';
import { formatInteger, pluralize } from 'react-cheminfo/core';
import { ParallelCoordinates, useContainerSize } from 'react-cheminfo/ui';
import { MF } from 'react-mf';

import type { OsirisProperties } from '../../osiris/index.ts';
import type { MoleculeRow } from '../../state/index.ts';

import { ComparePlotControls } from './ComparePlotControls.tsx';
import type { AxisKey } from './compareAxes.ts';
import { axisLabel, axisValue, plotAxesSelection } from './compareAxes.ts';
import { lineAlpha } from './compareInk.ts';

/** What the figure is drawn at until its container has been measured. */
const FALLBACK_WIDTH = 900;

/** How tall the figure stands, axis names and tick labels included. */
const PLOT_HEIGHT = 340;

/** What {@link ComparePlot} needs. */
export interface ComparePlotProps {
  /** The set, in the figure's row order. */
  rows: readonly MoleculeRow[];
  /** What has been predicted, by row key. */
  results: ReadonlyMap<string, OsirisProperties>;
  /** The axes, from left to right. */
  axes: readonly ParallelAxis[];
  /** Which columns they are. */
  axisKeys: readonly AxisKey[];
  /**
   * Called with the columns to draw instead — a list of keys, or the one
   * marker that says the reader turned every column off.
   */
  onAxisKeys: (keys: readonly string[]) => void;
  /** Which column the lines are coloured by. */
  colorKey: AxisKey;
  /** Called with the column to colour by instead. */
  onColorKey: (key: AxisKey) => void;
  /** Every row's value on that column. */
  colorValues: Float64Array;
  /** The ramp the colour is read on. */
  scale: ColorScale;
  /** The named scale in force, as the picker writes it. */
  scaleId: string;
  /** Called with the scale the reader chose. */
  onScaleId: (id: string) => void;
  /** The interval each axis keeps, keyed by axis id. */
  ranges: ParallelRanges;
  /** Called when a brush is released. */
  onRangeChange: (axisId: string, range: ParallelRange | null) => void;
  /** Called when every brush is to be cleared. */
  onClearRanges: () => void;
  /** Which rows the brushes keep, one byte per row. */
  included: Uint8Array;
  /** How many rows that is. */
  kept: number;
  /** Whether any axis carries a brush at all. */
  brushed: boolean;
  /** The row under the pointer, or `-1`. */
  hovered: number;
  /** Called with the row under the pointer. */
  onHover: (index: number) => void;
  /** The focused row, or `-1`. */
  selected: number;
  /** Called with the row a click names, or `-1` for empty ground. */
  onRowClick: (index: number) => void;
}

/**
 * The parallel-coordinates figure, its controls and its legend.
 * @param props - See {@link ComparePlotProps}.
 * @returns The controls, the figure, and the sentence under it.
 */
export function ComparePlot(props: ComparePlotProps): ReactElement {
  const {
    rows,
    results,
    axes,
    axisKeys,
    onAxisKeys,
    colorKey,
    onColorKey,
    colorValues,
    scale,
    scaleId,
    onScaleId,
    ranges,
    onRangeChange,
    onClearRanges,
    included,
    kept,
    brushed,
    hovered,
    onHover,
    selected,
    onRowClick,
  } = props;
  const box = useRef<HTMLDivElement>(null);
  const measured = useContainerSize(box);
  // The width most screens give it, rather than the ten pixels a zero
  // measurement clamps the axes to before the observer has reported.
  const width = measured.width > 0 ? measured.width : FALLBACK_WIDTH;

  return (
    <div className="compare-plot">
      <ComparePlotControls
        axisKeys={axisKeys}
        onAxisKeys={(keys) => {
          onAxisKeys(plotAxesSelection(keys));
        }}
        colorKey={colorKey}
        onColorKey={onColorKey}
        extent={extentOf(colorValues)}
        scale={scale}
        scaleId={scaleId}
        onScaleId={onScaleId}
      />

      <div ref={box} className="compare-plot__figure">
        {axes.length < 2 ? (
          <NonIdealState
            icon="doughnut-chart"
            description="Choose at least two columns to draw them against each other."
          />
        ) : (
          <ParallelCoordinates
            axes={axes}
            count={rows.length}
            width={width}
            height={PLOT_HEIGHT}
            ranges={ranges}
            onRangeChange={onRangeChange}
            included={included}
            hovered={hovered}
            onHoverChange={onHover}
            selected={selected === -1 ? EMPTY_SELECTION : [selected]}
            onRowClick={onRowClick}
            color={{ values: colorValues, scale }}
            ink={{ includedAlpha: lineAlpha(rows.length) }}
            testId="compare-plot"
            renderTooltip={({ index }) => (
              <PlotTooltip
                row={rows[index]}
                properties={results.get(rows[index]?.key ?? '')}
                colorKey={colorKey}
              />
            )}
            empty={
              <NonIdealState
                icon="scatter-plot"
                description="Add molecules and every one of them becomes a line across these axes."
              />
            }
          />
        )}
      </div>

      <p className="compare-kept">
        {brushed
          ? `${formatInteger(kept)} of ${formatInteger(rows.length)} ${molecules(rows.length)} kept`
          : `${formatInteger(rows.length)} ${molecules(rows.length)}`}
        {brushed ? (
          <Button
            variant="minimal"
            icon="filter-remove"
            text="Clear the brushes"
            onClick={onClearRanges}
          />
        ) : null}
      </p>
    </div>
  );
}

/**
 * The noun that agrees with the count beside it, so a set of one does not read
 * "1 molecules".
 * @param count - How many rows the sentence is about.
 * @returns The noun, singular or plural.
 */
function molecules(count: number): string {
  return pluralize(count, 'molecule');
}

/** Nothing singled out, shared so the figure is not handed a new array a frame. */
const EMPTY_SELECTION: readonly number[] = [];

function PlotTooltip(props: {
  row: MoleculeRow | undefined;
  properties: OsirisProperties | undefined;
  colorKey: AxisKey;
}): ReactElement | null {
  const { row, properties, colorKey } = props;
  if (row === undefined) return null;
  const value = axisValue(properties, colorKey);

  return (
    <>
      <div className="compare-tooltip__name">{row.label}</div>
      {properties === undefined ? null : (
        <MF mf={properties.molecularFormula} />
      )}
      <div>
        {axisLabel(colorKey)}{' '}
        {Number.isFinite(value) ? value.toFixed(2) : 'not predicted yet'}
      </div>
    </>
  );
}

function extentOf(values: Float64Array): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min > max) return { min: 0, max: 1 };
  return { min, max };
}
