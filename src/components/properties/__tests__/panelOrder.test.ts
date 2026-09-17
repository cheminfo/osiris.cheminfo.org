/**
 * The order the panel draws in is the legacy explorer's, top to bottom, and the
 * comparison table's columns and the plot's default axes read the same list. A
 * reader who learned the panel reads the table without relearning it, so the
 * order is pinned here as well as in the domain.
 */

import { expect, test } from 'vitest';

import {
  PROPERTY_KEYS,
  RISK_TYPES,
  propertyScale,
} from '../../../osiris/index.ts';

test('the ten properties are in the order the original panel showed them', () => {
  expect([...PROPERTY_KEYS]).toStrictEqual([
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
});

test('the rows read as the panel writes them, ending on the drug score', () => {
  const labels = PROPERTY_KEYS.map((key) => propertyScale(key).label);

  expect(labels[0]).toBe('cLogP');
  expect(labels[1]).toBe('Solubility');
  expect(labels[2]).toBe('Molweight');
  expect(labels[3]).toBe('TPSA');
  expect(labels.at(-1)).toBe('Drug score');
});

test('the four risks are in the order the library numbers them', () => {
  expect([...RISK_TYPES]).toStrictEqual([
    'mutagenic',
    'tumorigenic',
    'irritant',
    'reproductive',
  ]);
});

test('every property the panel draws has a scale to draw it on', () => {
  for (const key of PROPERTY_KEYS) {
    const scale = propertyScale(key);
    expect(scale.key).toBe(key);
    expect(scale.rangeMax).toBeGreaterThan(scale.rangeMin);
  }
});
