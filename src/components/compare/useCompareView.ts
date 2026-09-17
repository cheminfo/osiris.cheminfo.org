/**
 * Everything the comparison page derives from the set: the axes, the colours,
 * the mask, the rows on screen and the focused molecule.
 *
 * It is one hook rather than a dozen memos in the page because they depend on
 * each other in an order that matters, and because the page is then layout.
 * The answers arrive in a map that is mutated rather than rebuilt — copying a
 * growing map once per molecule costs more than the predictions do — so the
 * memos below read it through `answers`, which is rebuilt whenever one lands.
 */

import { useCallback, useMemo, useState } from 'react';
import type {
  ColorScale,
  ParallelAxis,
  ParallelRange,
  ParallelRanges,
} from 'react-cheminfo/core';
import { parallelIncludedMask, resolveColorScale } from 'react-cheminfo/core';

import type { PredictionInput, RiskType } from '../../osiris/index.ts';
import type { UsePredictionsResult } from '../../osiris/ui/index.ts';
import { usePredictions } from '../../osiris/ui/index.ts';
import type { MoleculeRow } from '../../state/index.ts';
import { setFocus, state } from '../../state/index.ts';

import type { AxisKey } from './compareAxes.ts';
import {
  axisKeysOf,
  colorValues,
  compareAxes,
  isAxisKey,
} from './compareAxes.ts';
import { focusIndexOf, hideDuplicates, keptIndices } from './compareRows.ts';
import type { CompareSet } from './useCompareSet.ts';

/** How many rows are drawn before the reader asks for more. */
export const ROWS_STEP = 50;

/**
 * What the lines are coloured by until the reader says otherwise: the original
 * explorer shaded its rows by cLogP, and a reader who knew it finds the same
 * picture here.
 */
export const DEFAULT_COLOR_KEY: AxisKey = 'logP';

/** What the page draws, worked out from the set and the answers so far. */
export interface CompareView {
  /** The prediction pool, its answers and its progress. */
  prediction: UsePredictionsResult;
  /** The axes, from left to right. */
  axes: readonly ParallelAxis[];
  /** Which columns they are. */
  axisKeys: readonly AxisKey[];
  /** Which column the lines are coloured by. */
  colorKey: AxisKey;
  /** Every row's value on that column. */
  colorValues: Float64Array;
  /** The ramp it is read on. */
  scale: ColorScale;
  /** The interval each axis keeps. */
  ranges: ParallelRanges;
  /** Whether any axis carries one. */
  brushed: boolean;
  /** Keep an interval on one axis, or `null` to keep all of it. */
  setRange: (axisId: string, range: ParallelRange | null) => void;
  /** Clear every brush at once. */
  clearRanges: () => void;
  /** Which rows are kept, one byte per row. */
  included: Uint8Array;
  /** How many that is. */
  kept: number;
  /** All of them, in set order, for a download. */
  keptRows: MoleculeRow[];
  /** The ones on screen, as indices into the set. */
  indices: number[];
  /** Show one more page of rows. */
  showMore: () => void;
  /** The focused row, or `-1`. */
  selected: number;
  /** The focused row itself, or `undefined`. */
  focusRow: MoleculeRow | undefined;
  /** Focus one row by its index, or `-1` to focus none. */
  select: (index: number) => void;
  /** The row under the pointer, in the table or in the plot, or `-1`. */
  hovered: number;
  /** Put the pointer on one row, or `-1` for none. */
  setHovered: (index: number) => void;
  /** Which risk of the focused molecule has its explanation open. */
  openRisk: RiskType | null;
  /** Open one risk's explanation, or `null` to close it. */
  setOpenRisk: (risk: RiskType | null) => void;
}

/**
 * Everything the page draws.
 * @param set - The set, from {@link useCompareSet}.
 * @returns See {@link CompareView}.
 */
export function useCompareView(set: CompareSet): CompareView {
  const { rows } = set;
  const showDuplicates = state.preferences.showDuplicates.value;
  const requestedAxes = state.view.compare.axes.value;
  const requestedColor = state.view.compare.colorBy.value;
  const [shown, setShown] = useState(ROWS_STEP);
  // Which row was clicked. The address carries the focused structure, which is
  // what a link means, so this is what tells two rows of the same structure
  // apart until one of them leaves or the address moves elsewhere.
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [ranges, setRanges] = useState<ParallelRanges>({});
  const [hovered, setHovered] = useState(-1);
  const [openRisk, setOpenRisk] = useState<RiskType | null>(null);

  const molecules = useMemo<PredictionInput[]>(
    () =>
      rows.map((row) => ({
        key: row.key,
        idCode: row.idCode,
        label: row.label,
      })),
    [rows],
  );
  // The rows the reader can see, so the pool answers those first. Read off the
  // set rather than off the brushed mask on purpose: a brush is drawn on values
  // that already exist, so by the time one is in force there is nothing left to
  // prioritise, and depending on the answers here would reorder the queue once
  // per answer for nothing.
  const visibleKeys = useMemo(
    () => leadingKeys(rows, shown, showDuplicates),
    [rows, shown, showDuplicates],
  );

  const prediction = usePredictions({
    molecules,
    visibleKeys,
    enabled: set.status !== 'reading',
  });
  const { results, progress } = prediction;
  // The answers arrive in one map, mutated as each worker returns rather than
  // rebuilt — copying a growing map once per molecule costs more than the
  // predictions do — so its identity never changes and nothing downstream can
  // key on it. This pair is what changes when an answer lands, and it is what
  // the memos below read the answers through.
  const answers = useMemo(
    () => ({ results, count: progress.done }),
    [results, progress.done],
  );

  const axisKeys = useMemo(() => axisKeysOf(requestedAxes), [requestedAxes]);
  const colorKey = isAxisKey(requestedColor)
    ? requestedColor
    : DEFAULT_COLOR_KEY;

  const axes = useMemo(
    () => compareAxes(rows, answers.results, axisKeys),
    [rows, answers, axisKeys],
  );
  const color = useMemo(
    () => colorValues(rows, answers.results, colorKey),
    [rows, answers, colorKey],
  );
  const included = useMemo(() => {
    const mask = parallelIncludedMask(axes, ranges, rows.length);
    return showDuplicates ? mask : hideDuplicates(mask, rows);
  }, [axes, ranges, rows, showDuplicates]);
  const keptRows = useMemo(() => {
    const kept: MoleculeRow[] = [];
    for (const index of keptIndices(included, rows.length)) {
      const row = rows[index];
      if (row !== undefined) kept.push(row);
    }
    return kept;
  }, [included, rows]);
  const indices = useMemo(
    () => keptIndices(included, shown),
    [included, shown],
  );

  const selected = focusIndexOf(rows, state.view.compare.focus.value, focusKey);

  return {
    prediction,
    axes,
    axisKeys,
    colorKey,
    colorValues: color,
    scale: resolveColorScale(state.preferences.colorScaleId.value).scale,
    ranges,
    brushed: isBrushed(ranges),
    setRange: useCallback((axisId: string, range: ParallelRange | null) => {
      setRanges((previous) => ({ ...previous, [axisId]: range }));
    }, []),
    clearRanges: useCallback(() => {
      setRanges({});
    }, []),
    included,
    kept: keptRows.length,
    keptRows,
    indices,
    showMore: useCallback(() => {
      setShown((previous) => previous + ROWS_STEP);
    }, []),
    selected,
    focusRow: selected === -1 ? undefined : rows[selected],
    select: useCallback((index: number) => {
      const row = index === -1 ? undefined : state.data.molecules.peek()[index];
      setFocusKey(row?.key ?? null);
      setFocus(row?.idCode ?? null);
      setOpenRisk(null);
    }, []),
    hovered,
    setHovered,
    openRisk,
    setOpenRisk,
  };
}

function isBrushed(ranges: ParallelRanges): boolean {
  for (const range of Object.values(ranges)) {
    if (range !== null && range !== undefined) return true;
  }
  return false;
}

function leadingKeys(
  rows: readonly MoleculeRow[],
  limit: number,
  showDuplicates: boolean,
): string[] {
  const keys: string[] = [];
  for (const row of rows) {
    if (keys.length === limit) break;
    if (!showDuplicates && row.duplicateOf !== null) continue;
    keys.push(row.key);
  }
  return keys;
}
