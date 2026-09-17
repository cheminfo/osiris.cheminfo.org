import { expect, test } from 'vitest';

import { barGeometry } from '../barGeometry.ts';

test('a value with no bar to draw has no geometry', () => {
  expect(barGeometry('logP', null)).toBeNull();
  expect(barGeometry('drugScore', Number.NaN)).toBeNull();
});

test('a plain bar grows from the left, and marks its published threshold', () => {
  // Benzene's cLogP. The scale runs 0 to 8, so 1.6596 is 20.745% along it, and
  // the rule of thumb the mark names — cLogP ≤ 5 — sits at 62.5%.
  const bar = barGeometry('logP', 1.6596);

  expect(bar).toStrictEqual({
    start: 0,
    length: 0.20745,
    fitness: 0.990_813_579_117_025_9,
    origin: 0,
    mark: 0.625,
    markLabel: '≤ 5',
  });
});

test('a diverging bar grows from the middle of its own range', () => {
  // Benzene's drug-likeness, −4.8375 on a −10 to 10 scale: the fill runs from
  // the middle back to 25.8%, which is what says the value is negative.
  const bar = barGeometry('druglikeness', -4.8375);

  expect(bar?.origin).toBe(0.5);
  expect(bar?.start).toBe(0.258_125);
  expect(bar?.length).toBe(0.241_875);
  expect(bar?.mark).toBe(0.5);
  expect(bar?.markLabel).toBe('> 0');
});

test('a diverging bar above its middle starts at the middle', () => {
  // Benzene's drug score, 0.06 on a −1 to 1 scale.
  const bar = barGeometry('drugScore', 0.062_941_190_977_554_32);

  expect(bar?.start).toBe(0.5);
  expect(bar?.length).toBeCloseTo(0.031_470_6, 6);
  // Already a 0-to-1 fitness — the product of the four valuations the drug
  // score is made of — so it is not valued a second time.
  expect(bar?.fitness).toBe(0.062_941_190_977_554_32);
  expect(bar?.mark).toBeNull();
  expect(bar?.markLabel).toBeNull();
});

test('a value past the end of its range fills the bar rather than overflowing it', () => {
  // Cholesterol's cLogP is 7.18, inside the scale; a logP of 12 is not, and a
  // range is a typical spread rather than a bound.
  expect(barGeometry('logP', 12)?.length).toBe(1);
  expect(barGeometry('logS', -20)?.length).toBe(0);
  expect(barGeometry('logS', -20)?.fitness).toBeCloseTo(0, 12);
});

test('the fitness is worst where the property is worst', () => {
  const light = barGeometry('molecularWeight', 78.113_64);
  const heavy = barGeometry('molecularWeight', 780);

  expect(light?.fitness).toBeGreaterThan(0.99);
  expect(heavy?.fitness).toBeLessThan(0.01);
  expect(light?.mark).toBe(0.5625);
  expect(light?.markLabel).toBe('< 450');
});

test('a count with no published threshold draws a bar and no mark', () => {
  const bar = barGeometry('donorCount', 2);

  expect(bar?.start).toBe(0);
  expect(bar?.length).toBe(0.25);
  expect(bar?.mark).toBeNull();
});
