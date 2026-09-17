import { expect, test } from 'vitest';

import type { OsirisProperties } from '../core/index.ts';
import {
  PROPERTY_KEYS,
  PROPERTY_SCALES,
  getValuation,
  isPropertyKey,
  propertyFitness,
  propertyPosition,
  propertyScale,
  propertyValue,
} from '../core/index.ts';

test('the properties are listed in the order the panel shows them', () => {
  expect(PROPERTY_KEYS).toStrictEqual([
    'logP',
    'logS',
    'molecularWeight',
    'polarSurfaceArea',
    'druglikeness',
    'acceptorCount',
    'donorCount',
    'stereoCenterCount',
    'rotatableBondCount',
    'drugScore',
  ]);
  expect(isPropertyKey('logP')).toBe(true);
  expect(isPropertyKey('mass')).toBe(false);
});

test('getValuation is 1 inside the band and falls away outside it', () => {
  // Bounded above only: 1/(1 + e^((value - max) / halfWidth)).
  expect(getValuation(0, null, 4, 0.5)).toBeCloseTo(1 / (1 + Math.exp(-8)), 12);
  expect(getValuation(4, null, 4, 0.5)).toBe(0.5);
  expect(getValuation(4.5, null, 4, 0.5)).toBeCloseTo(1 / (1 + Math.E), 12);
  expect(getValuation(3.5, null, 4, 0.5)).toBeCloseTo(1 / (1 + 1 / Math.E), 12);

  // Bounded below only, which is how solubility is judged.
  expect(getValuation(-4, -4, null, 0.5)).toBe(0.5);
  expect(getValuation(0, -4, null, 0.5)).toBeCloseTo(
    1 / (1 + Math.exp(-8)),
    12,
  );
  expect(getValuation(-8, -4, null, 0.5)).toBeLessThan(0.001);

  // A band applies both factors, so one narrower than its half-width never
  // reaches 1 anywhere: stereocentres peak at 0.39, in the middle of 1 to 3.
  const factor = 1 / (1 + Math.exp(-0.5));
  const peak = getValuation(2, 1, 3, 2);
  expect(peak).toBeCloseTo(factor * factor, 12);
  expect(peak).toBeGreaterThan(getValuation(0, 1, 3, 2));
  expect(peak).toBeGreaterThan(getValuation(6, 1, 3, 2));

  expect(getValuation(Number.NaN, null, 4, 0.5)).toBeNaN();
  // An absent bound may arrive as NaN, which is how the Java original writes it.
  expect(getValuation(99, Number.NaN, Number.NaN, 1)).toBe(1);
});

test('eight scales come from DataWarrior, two from the legacy explorer', () => {
  const datawarrior = [
    ['logP', 0, 8, null, 4, 0.5],
    ['logS', -8, 2, -4, null, 0.5],
    ['molecularWeight', 0, 800, null, 400, 50],
    ['polarSurfaceArea', 0, 250, null, 120, 20],
    ['acceptorCount', 0, 16, null, 10, 1],
    ['donorCount', 0, 8, null, 5, 0.5],
    ['stereoCenterCount', 0, 8, 1, 3, 2],
    ['rotatableBondCount', 0, 20, null, 4, 5],
  ] as const;

  for (const [key, rangeMin, rangeMax, min, max, halfWidth] of datawarrior) {
    const scale = propertyScale(key);
    expect([
      scale.source,
      scale.rangeMin,
      scale.rangeMax,
      scale.preferredMin,
      scale.preferredMax,
      scale.halfWidth,
    ]).toStrictEqual(['datawarrior', rangeMin, rangeMax, min, max, halfWidth]);
  }

  // DataWarrior's SPEC table has no entry for either of these two, so the
  // legacy explorer's indicator ranges are kept.
  expect(PROPERTY_SCALES.druglikeness.rangeMin).toBe(-10);
  expect(PROPERTY_SCALES.druglikeness.rangeMax).toBe(10);
  expect(PROPERTY_SCALES.druglikeness.source).toBe('legacy');
  expect(PROPERTY_SCALES.drugScore.rangeMin).toBe(-1);
  expect(PROPERTY_SCALES.drugScore.rangeMax).toBe(1);
  expect(PROPERTY_SCALES.drugScore.source).toBe('legacy');
  expect(PROPERTY_SCALES.druglikeness.diverging).toBe(true);
  expect(PROPERTY_SCALES.drugScore.diverging).toBe(true);
});

test('the labelled marks are the published thresholds', () => {
  expect(PROPERTY_SCALES.logP.threshold).toStrictEqual({
    value: 5,
    label: '≤ 5',
  });
  expect(PROPERTY_SCALES.logS.threshold).toStrictEqual({
    value: -4,
    label: '> −4',
  });
  expect(PROPERTY_SCALES.molecularWeight.threshold).toStrictEqual({
    value: 450,
    label: '< 450',
  });
  expect(PROPERTY_SCALES.druglikeness.threshold).toStrictEqual({
    value: 0,
    label: '> 0',
  });
  // The preferred band and the published rule of thumb are different numbers:
  // DataWarrior closes cLogP's band at 4, the published rule says 5.
  expect(PROPERTY_SCALES.logP.preferredMax).toBe(4);
});

test('which way each property is better', () => {
  expect(PROPERTY_SCALES.logS.higherIsBetter).toBe(true);
  expect(PROPERTY_SCALES.druglikeness.higherIsBetter).toBe(true);
  expect(PROPERTY_SCALES.drugScore.higherIsBetter).toBe(true);
  expect(PROPERTY_SCALES.logP.higherIsBetter).toBe(false);
  expect(PROPERTY_SCALES.molecularWeight.higherIsBetter).toBe(false);
  // A molecule wants some stereocentres, not as many or as few as possible.
  expect(PROPERTY_SCALES.stereoCenterCount.higherIsBetter).toBeNull();
});

test('every scale names itself and says how to print its value', () => {
  for (const key of PROPERTY_KEYS) {
    const scale = propertyScale(key);
    expect(scale.key).toBe(key);
    expect(scale.label.length).toBeGreaterThan(0);
    expect(scale.rangeMax).toBeGreaterThan(scale.rangeMin);
  }
  expect(PROPERTY_SCALES.molecularWeight.unit).toBe('g/mol');
  expect(PROPERTY_SCALES.polarSurfaceArea.unit).toBe('Å²');
  expect(PROPERTY_SCALES.acceptorCount.decimals).toBe(0);
  expect(PROPERTY_SCALES.logP.decimals).toBe(2);
});

test('the fitness is the ramp, the position is the bar', () => {
  expect(propertyFitness('logP', 4)).toBe(0.5);
  expect(propertyFitness('logP', null)).toBeNull();
  // The drug score is already a 0-to-1 fitness, so it is not valued again.
  expect(propertyFitness('drugScore', 0.06)).toBe(0.06);
  expect(propertyFitness('drugScore', 2)).toBe(1);

  expect(propertyPosition('logP', 0)).toBe(0);
  expect(propertyPosition('logP', 8)).toBe(1);
  expect(propertyPosition('druglikeness', 0)).toBe(0.5);
  // A range is a typical spread, not a bound: cholesterol runs past it.
  expect(propertyPosition('logS', -9)).toBe(0);
  expect(propertyPosition('logS', null)).toBeNull();
});

test('propertyValue reads the field the key names', () => {
  const properties: OsirisProperties = {
    idCode: 'dklB@@QmR[fUxUZBBF@@',
    smiles: 'CC(OC1=CC=CC=C1C(O)=O)=O',
    label: 'Aspirin',
    molecularFormula: 'C9H8O4',
    molecularWeight: 180.158_52,
    logP: 1.1314,
    logS: -1.929,
    polarSurfaceArea: 63.6,
    druglikeness: -0.4776,
    drugScore: null,
    acceptorCount: 4,
    donorCount: 1,
    stereoCenterCount: 0,
    rotatableBondCount: 3,
    risks: {
      mutagenic: 'high',
      tumorigenic: 'high',
      irritant: 'none',
      reproductive: 'high',
    },
  };

  for (const key of PROPERTY_KEYS) {
    expect(propertyValue(properties, key)).toBe(properties[key]);
  }
  expect(propertyValue(properties, 'logP')).toBe(1.1314);
  // An unknown value is null, never zero: zero sorts and plots as a real value.
  expect(propertyValue(properties, 'drugScore')).toBeNull();
});
