import { expect, test } from 'vitest';

import { PredictorsUnavailableError, resetPredictors } from '../core/index.ts';

import { osirisResources, testPredictors } from './osirisResources.ts';

// `Resources.register` replaces the whole map, so these run in order: the
// broken registrations first, the real one last.

test('a URL that cannot be fetched is refused, and is not cached', async () => {
  await expect(testPredictors('not a url')).rejects.toBeInstanceOf(
    PredictorsUnavailableError,
  );
  await expect(testPredictors('not a url')).rejects.toThrow(
    /did not load, so no risk or drug-likeness can be computed/,
  );
});

test('resources that registered but hold nothing are caught at start-up', async () => {
  // The dangerous case: with something registered, neither predictor throws.
  // The toxicity predictor answers every risk with 0, drug-likeness answers
  // -999, and `DrugScoreCalculator` applies no penalty at all — so the page
  // would show four clean squares and a healthy score.
  resetPredictors();
  await expect(
    testPredictors({ '/resources/nothing.txt': 'not a fragment table' }),
  ).rejects.toBeInstanceOf(PredictorsUnavailableError);
});

test('the thirteen OSIRIS tables are enough, and recover from a bad set', async () => {
  resetPredictors();
  const resources = osirisResources();
  expect(Object.keys(resources)).toHaveLength(13);

  const predictors = await testPredictors(resources);
  const benzidine = predictors.Molecule.fromIDCode('dg}@@@mIe]e^ftx@H@H@@');
  expect(predictors.toxicity.assessRisk(benzidine, 0)).toBe(3);
  expect(predictors.druglikeness.assessDruglikeness(benzidine)).toBeCloseTo(
    -7.134_903_320_081_218,
    12,
  );
});

test('the predictors are loaded once and kept', async () => {
  const first = await testPredictors();
  const second = await testPredictors();
  expect(second).toBe(first);
});
