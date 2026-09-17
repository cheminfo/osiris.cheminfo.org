import { expect, test } from 'vitest';

import { RISK_LEVELS } from '../../../osiris/index.ts';
import {
  IDLE_RISK_LABEL,
  PENDING_RISK_LABEL,
  riskAppearance,
} from '../riskAppearance.ts';

test('the three assessed levels are the three the drug score multiplies by', () => {
  expect(riskAppearance('none')).toStrictEqual({
    tone: 'none',
    label: 'No risk',
    explainable: true,
  });
  expect(riskAppearance('low')).toStrictEqual({
    tone: 'low',
    label: 'Medium risk',
    explainable: true,
  });
  expect(riskAppearance('high')).toStrictEqual({
    tone: 'high',
    label: 'High risk',
    explainable: true,
  });
});

test('a risk the library never assessed is never shown as no risk', () => {
  const unknown = riskAppearance('unknown');

  expect(unknown.tone).toBe('unknown');
  expect(unknown.label).toBe('Not assessed');
  // Nothing was assessed, so there is nothing to explain.
  expect(unknown.explainable).toBe(false);
});

test('a molecule still being predicted says so, and is not a level', () => {
  const pending = riskAppearance(undefined, true);

  expect(pending.tone).toBe('pending');
  expect(pending.label).toBe(PENDING_RISK_LABEL);
  expect(pending.explainable).toBe(false);
  expect(RISK_LEVELS).not.toContain(pending.tone);
});

test('a square with no molecule behind it does not claim to be working', () => {
  // The comparison page draws the panel before a row is picked. Saying
  // `Predicting…` there, under a heading asking the reader to pick a row,
  // claims work nobody asked for.
  const idle = riskAppearance(undefined);

  expect(idle.label).toBe(IDLE_RISK_LABEL);
  expect(idle.label).not.toBe(PENDING_RISK_LABEL);
  expect(idle.explainable).toBe(false);
  // And it is still not one of the levels the library can return.
  expect(RISK_LEVELS).not.toContain(idle.tone);
});

test('every level the library can return has an appearance', () => {
  for (const level of RISK_LEVELS) {
    expect(riskAppearance(level).tone).toBe(level);
    expect(riskAppearance(level).label).not.toBe('');
  }
});
