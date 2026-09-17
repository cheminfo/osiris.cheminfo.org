/**
 * Which columns the plot can draw, and how a set of rows becomes them.
 *
 * An axis is built once per change of the set or of the answers, with
 * `parallelAxisOf`: the figure then reads a `Float64Array` in place rather than
 * calling an accessor per value per repaint. A molecule still being predicted
 * has no number on any axis, so its value is `NaN` and the figure draws no
 * point for it — the line reappears, whole, when its worker answers.
 *
 * The four risks are axes too. They are coded `0`, `1`, `2` with the ticks
 * written out, because a graduation reading `1.5` on a quantity whose only
 * values are "none", "medium" and "high" says nothing.
 */

import type { ParallelAxis } from 'react-cheminfo/core';
import { parallelAxisOf } from 'react-cheminfo/core';

import type {
  OsirisProperties,
  PropertyKey,
  RiskLevel,
  RiskType,
} from '../../osiris/index.ts';
import {
  PROPERTY_KEYS,
  RISK_LABELS,
  RISK_TYPES,
  isPropertyKey,
  propertyScale,
  propertyValue,
} from '../../osiris/index.ts';
import type { MoleculeRow } from '../../state/index.ts';

/** A column the plot can draw: one of the ten numbers, or one of the four risks. */
export type AxisKey = PropertyKey | RiskType;

/** Every column the plot offers, the numbers first and the risks after them. */
export const AXIS_KEYS: readonly AxisKey[] = [...PROPERTY_KEYS, ...RISK_TYPES];

/**
 * The axes the legacy explorer drew, which is what the plot opens on: the size,
 * the two solubility terms, the two hydrogen-bond counts, and the two scores.
 */
export const DEFAULT_AXIS_KEYS: readonly AxisKey[] = [
  'molecularWeight',
  'logP',
  'logS',
  'donorCount',
  'acceptorCount',
  'druglikeness',
  'drugScore',
];

/** What a risk axis is graduated with, since its values are words, not numbers. */
export const RISK_TICKS = [
  { value: 0, label: 'none' },
  { value: 1, label: 'medium' },
  { value: 2, label: 'high' },
] as const;

/** Where each assessed level sits on a risk axis; an unassessed one sits nowhere. */
const RISK_POSITIONS: Record<RiskLevel, number> = {
  unknown: Number.NaN,
  none: 0,
  low: 1,
  high: 2,
};

/** What a risk axis reaches, so a set that is all green still draws three ticks. */
const RISK_DOMAIN = [0, 2] as const;

/**
 * What an address and a selection both say for "every column is off".
 *
 * An empty list cannot be written into an address — `stringParam` deletes a
 * parameter carrying nothing — so "the reader turned every column off" and "the
 * address named no columns" would otherwise be the same state, and pressing the
 * last active capsule would turn all seven defaults back on.
 */
export const NO_AXES = 'none';

/**
 * What the capsule row hands back, so an empty selection stays an empty one.
 * @param keys - The columns the reader left on.
 * @returns The keys, or the marker for none.
 */
export function plotAxesSelection(keys: readonly AxisKey[]): readonly string[] {
  return keys.length === 0 ? [NO_AXES] : keys;
}

/**
 * Whether a string names a column the plot can draw, so an address naming
 * something else is ignored rather than plotted as a blank axis.
 * @param value - Whatever the address or the reader supplied.
 * @returns True when it is one of {@link AXIS_KEYS}.
 */
export function isAxisKey(value: string): value is AxisKey {
  return (
    isPropertyKey(value) || (RISK_TYPES as readonly string[]).includes(value)
  );
}

/**
 * The columns to draw, from whatever an address asked for.
 * @param requested - The keys the address named, in the order it named them.
 * @returns The keys it named that exist, without repeats; none at all when it
 * said {@link NO_AXES}, and {@link DEFAULT_AXIS_KEYS} when it named nothing.
 */
export function axisKeysOf(requested: readonly string[]): AxisKey[] {
  const keys: AxisKey[] = [];
  const seen = new Set<AxisKey>();
  let emptied = false;
  for (const value of requested) {
    if (value === NO_AXES) {
      emptied = true;
      continue;
    }
    if (!isAxisKey(value) || seen.has(value)) continue;
    seen.add(value);
    keys.push(value);
  }
  if (keys.length > 0) return keys;
  return emptied ? [] : [...DEFAULT_AXIS_KEYS];
}

/**
 * What one column is called, on an axis and in a menu.
 * @param key - The column.
 * @returns Its name.
 */
export function axisLabel(key: AxisKey): string {
  return isPropertyKey(key) ? propertyScale(key).label : RISK_LABELS[key];
}

/**
 * Where one molecule sits on one axis.
 * @param properties - What was predicted for it, or `undefined` while its
 * prediction is still running.
 * @param key - The column.
 * @returns The value, or `NaN` when it is not known — never zero, which is a
 * real value on nine of these fourteen axes.
 */
export function axisValue(
  properties: OsirisProperties | undefined,
  key: AxisKey,
): number {
  if (properties === undefined) return Number.NaN;
  if (isPropertyKey(key)) return propertyValue(properties, key) ?? Number.NaN;
  return RISK_POSITIONS[properties.risks[key]];
}

/**
 * Build the plot's axes over the set as it stands.
 * @param rows - The set, in the order the figure indexes it.
 * @param results - What has been predicted so far, by row key.
 * @param keys - The columns to draw, from left to right.
 * @returns One axis per column, each holding every row's value.
 */
export function compareAxes(
  rows: readonly MoleculeRow[],
  results: ReadonlyMap<string, OsirisProperties>,
  keys: readonly AxisKey[],
): ParallelAxis[] {
  const axes: ParallelAxis[] = [];
  for (const key of keys) {
    axes.push(
      isPropertyKey(key)
        ? propertyAxis(rows, results, key)
        : riskAxis(rows, results, key),
    );
  }
  return axes;
}

/**
 * Every row's value on one column, for the colour ramp.
 *
 * Its own array rather than the axis's, so the lines can be coloured by a
 * property the plot is not drawing.
 * @param rows - The set, in the order the figure indexes it.
 * @param results - What has been predicted so far, by row key.
 * @param key - The column.
 * @returns One value per row, `NaN` where it is not known.
 */
export function colorValues(
  rows: readonly MoleculeRow[],
  results: ReadonlyMap<string, OsirisProperties>,
  key: AxisKey,
): Float64Array {
  const values = new Float64Array(rows.length);
  for (let row = 0; row < rows.length; row++) {
    values[row] = axisValue(results.get((rows[row] as MoleculeRow).key), key);
  }
  return values;
}

function propertyAxis(
  rows: readonly MoleculeRow[],
  results: ReadonlyMap<string, OsirisProperties>,
  key: PropertyKey,
): ParallelAxis {
  const scale = propertyScale(key);
  return parallelAxisOf(rows, {
    id: key,
    label: scale.label,
    unit: scale.unit,
    format: (value) => value.toFixed(scale.decimals),
    value: (row) => axisValue(results.get(row.key), key),
  });
}

function riskAxis(
  rows: readonly MoleculeRow[],
  results: ReadonlyMap<string, OsirisProperties>,
  key: RiskType,
): ParallelAxis {
  return parallelAxisOf(rows, {
    id: key,
    label: RISK_LABELS[key],
    domain: RISK_DOMAIN,
    ticks: RISK_TICKS,
    value: (row) => axisValue(results.get(row.key), key),
  });
}
