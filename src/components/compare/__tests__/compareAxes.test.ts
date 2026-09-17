import { expect, test } from 'vitest';

import {
  AXIS_KEYS,
  DEFAULT_AXIS_KEYS,
  NO_AXES,
  RISK_TICKS,
  axisKeysOf,
  axisLabel,
  axisValue,
  colorValues,
  compareAxes,
  isAxisKey,
  plotAxesSelection,
} from '../compareAxes.ts';
import { lineAlpha } from '../compareInk.ts';

import { properties, row } from './fixtures.ts';

test('the columns are the ten numbers and the four risks', () => {
  expect(AXIS_KEYS).toHaveLength(14);
  expect(AXIS_KEYS.slice(10)).toStrictEqual([
    'mutagenic',
    'tumorigenic',
    'irritant',
    'reproductive',
  ]);
  expect(isAxisKey('logP')).toBe(true);
  expect(isAxisKey('irritant')).toBe(true);
  expect(isAxisKey('boilingPoint')).toBe(false);
});

test('an address naming nothing the plot draws falls back to the legacy axes', () => {
  expect(axisKeysOf([])).toStrictEqual([...DEFAULT_AXIS_KEYS]);
  expect(axisKeysOf(['nonsense'])).toStrictEqual([...DEFAULT_AXIS_KEYS]);
  expect(axisKeysOf(['logS', 'nonsense', 'logS', 'irritant'])).toStrictEqual([
    'logS',
    'irritant',
  ]);
});

test('a column is named the same on an axis as in the panel', () => {
  expect(axisLabel('logP')).toBe('cLogP');
  expect(axisLabel('molecularWeight')).toBe('Molweight');
  expect(axisLabel('mutagenic')).toBe('Mutagenicity');
});

test('a risk is coded none, medium, high — and nothing at all when unassessed', () => {
  const assessed = properties();
  expect(axisValue(assessed, 'mutagenic')).toBe(0);
  expect(axisValue(assessed, 'irritant')).toBe(1);
  expect(axisValue(assessed, 'reproductive')).toBe(2);
  expect(
    axisValue(
      properties({
        risks: {
          mutagenic: 'unknown',
          tumorigenic: 'none',
          irritant: 'none',
          reproductive: 'none',
        },
      }),
      'mutagenic',
    ),
  ).toBeNaN();
});

test('a value the predictor refused is not a zero', () => {
  expect(axisValue(properties({ drugScore: null }), 'drugScore')).toBeNaN();
  expect(axisValue(undefined, 'logP')).toBeNaN();
  expect(axisValue(properties({ logP: 0 }), 'logP')).toBe(0);
});

test('a row still being predicted has no value on any axis, and gains them all at once', () => {
  const rows = [row({ key: 'r0' }), row({ key: 'r1' })];
  const results = new Map([['r0', properties({ logP: 1.66 })]]);

  const pending = compareAxes(rows, results, ['logP', 'molecularWeight']);
  expect(pending).toHaveLength(2);
  expect(Array.from(pending[0]?.values ?? [])).toStrictEqual([
    1.66,
    Number.NaN,
  ]);

  results.set('r1', properties({ logP: -0.31, molecularWeight: 180.16 }));
  const filled = compareAxes(rows, results, ['logP', 'molecularWeight']);
  expect(Array.from(filled[0]?.values ?? [])).toStrictEqual([1.66, -0.31]);
  expect(Array.from(filled[1]?.values ?? [])).toStrictEqual([46.07, 180.16]);
});

test('a numeric axis carries its own unit and decimals; a risk axis carries its words', () => {
  const rows = [row({ key: 'r0' })];
  const [weight, risk] = compareAxes(rows, new Map([['r0', properties()]]), [
    'molecularWeight',
    'irritant',
  ]);

  expect(weight?.id).toBe('molecularWeight');
  expect(weight?.unit).toBe('g/mol');
  expect(weight?.format?.(46.0712)).toBe('46.07');
  expect(weight?.domain).toBeUndefined();

  expect(risk?.id).toBe('irritant');
  expect(risk?.domain).toStrictEqual([0, 2]);
  expect(risk?.ticks).toStrictEqual(RISK_TICKS);
});

test('the colour is read off its own column, drawn or not', () => {
  const rows = [row({ key: 'r0' }), row({ key: 'r1' })];
  const results = new Map([['r0', properties({ drugScore: 0.42 })]]);

  expect(Array.from(colorValues(rows, results, 'drugScore'))).toStrictEqual([
    0.42,
    Number.NaN,
  ]);
});

test('a handful of lines is drawn solidly, a library as a density', () => {
  expect(lineAlpha(0)).toBe(0.9);
  expect(lineAlpha(3)).toBe(0.9);
  expect(lineAlpha(120)).toBe(0.5);
  expect(lineAlpha(2000)).toBe(0.35);
});

test('turning every column off is a state of its own, not "the address said nothing"', () => {
  // What the capsule row hands back once the last active capsule is pressed.
  expect(plotAxesSelection([])).toStrictEqual([NO_AXES]);
  expect(plotAxesSelection(['logP', 'logS'])).toStrictEqual(['logP', 'logS']);

  expect(axisKeysOf([NO_AXES])).toStrictEqual([]);
  expect(axisKeysOf(plotAxesSelection([]))).toStrictEqual([]);
  // An address naming nothing still opens on the legacy axes, and a key the
  // plot does not draw is still ignored rather than read as "none".
  expect(axisKeysOf([])).toStrictEqual([...DEFAULT_AXIS_KEYS]);
  expect(axisKeysOf(['nonsense'])).toStrictEqual([...DEFAULT_AXIS_KEYS]);
  expect(axisKeysOf([NO_AXES, 'logP'])).toStrictEqual(['logP']);
  expect(isAxisKey(NO_AXES)).toBe(false);
});
