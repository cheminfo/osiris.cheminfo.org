import { expect, test } from 'vitest';

import {
  EMPTY_MOLECULE_MESSAGE,
  UNREADABLE_ID_CODE_MESSAGE,
  computeProperties,
  predictIdCode,
} from '../core/index.ts';

import { testPredictors } from './osirisResources.ts';
import { sentinelPredictors } from './stubPredictors.ts';

const predictors = await testPredictors();

const BENZENE = 'c1ccccc1';
const ASPIRIN = 'CC(=O)Oc1ccccc1C(=O)O';

function predict(smiles: string, label?: string) {
  const molecule = predictors.Molecule.fromSmiles(smiles);
  return computeProperties(
    molecule,
    predictors,
    label === undefined ? {} : { label },
  );
}

test('benzene reproduces the OSIRIS screenshot at the displayed precision', () => {
  const benzene = predict(BENZENE);

  expect(benzene.logP?.toFixed(2)).toBe('1.66');
  expect(benzene.logS?.toFixed(2)).toBe('-1.62');
  expect(benzene.molecularWeight.toFixed(2)).toBe('78.11');
  expect(benzene.polarSurfaceArea?.toFixed(2)).toBe('0.00');
  expect(benzene.druglikeness?.toFixed(2)).toBe('-4.84');
  expect(benzene.drugScore?.toFixed(2)).toBe('0.06');

  expect(benzene.molecularFormula).toBe('C6H6');
  expect(benzene.idCode).toBe('gFp@DiTt@@@');
  expect(benzene.risks).toStrictEqual({
    mutagenic: 'high',
    tumorigenic: 'high',
    irritant: 'high',
    reproductive: 'high',
  });
});

test('the molecular weight is the relative one, never the monoisotopic mass', () => {
  // 78.047 is the monoisotopic mass, which would display as 78.05 and is what
  // `absoluteWeight` returns.
  expect(predict(BENZENE).molecularWeight).toBeCloseTo(78.11364, 5);
});

test('the drug score takes the solubility, not the polar surface area', () => {
  const aspirin = predict(ASPIRIN);
  expect(aspirin.drugScore?.toFixed(4)).toBe('0.1430');

  // The legacy explorer passed `props.polarSurfaceArea` as the second argument
  // of `DrugScoreCalculator.calculate`, which is the SOLUBILITY. TPSA is a
  // different quantity in a different unit — 63.60 Å² where the solubility is
  // -1.93 — and the term it feeds, 1 - 1/(1 + e^(x + 5)), simply saturates at
  // 1. The two answers round to 0.14 and 0.15 on screen.
  const legacy = predictors.DrugScoreCalculator.calculate(
    aspirin.logP as number,
    aspirin.polarSurfaceArea as number,
    aspirin.molecularWeight,
    aspirin.druglikeness as number,
    [3, 3, 1, 3],
  );
  expect(legacy.toFixed(4)).toBe('0.1463');
  expect(legacy.toFixed(2)).toBe('0.15');
  expect(aspirin.drugScore?.toFixed(2)).toBe('0.14');
});

test('a molecule with no atoms is refused before anything is predicted', () => {
  // OpenChemLib answers an empty molecule with a full set of innocent numbers
  // and a drug score of 0.628, so the guard is ours to write.
  const empty = predictors.Molecule.fromSmiles('');
  expect(empty.getAllAtoms()).toBe(0);
  expect(() => computeProperties(empty, predictors)).toThrow(
    EMPTY_MOLECULE_MESSAGE,
  );
});

test('the molecule the caller owns is left exactly as it was', () => {
  const benzene = predictors.Molecule.fromSmiles(BENZENE);
  const before = benzene.getIDCode();
  computeProperties(benzene, predictors);
  expect(benzene.getIDCode()).toBe(before);
});

test('the label falls back to the canonical SMILES', () => {
  expect(predict(BENZENE).label).toBe('c1ccccc1');
  expect(predict(BENZENE, 'Benzene').label).toBe('Benzene');
});

test('the SMILES keeps stereochemistry, so two enantiomers stay two rows', () => {
  expect(predict('C[C@@H](N)C(=O)O').smiles).toBe('C[C@H](C(O)=O)N');
  expect(predict('C[C@H](N)C(=O)O').smiles).toBe('C[C@@H](C(O)=O)N');
});

test('a drug-likeness of -1 means no fragment matched, so no drug score', () => {
  // Methane matches none of the 5294 drug-likeness fragments, and `-1` is what
  // the library returns for that — indistinguishable from a real -1.
  const methane = predict('C');
  expect(methane.druglikeness).toBeNull();
  expect(methane.drugScore).toBeNull();
  expect(methane.logP).toBe(0);
});

test('every sentinel becomes null, and a sentinel refuses the drug score', () => {
  const molecule = predictors.Molecule.fromSmiles(BENZENE);

  const unknownLogP = computeProperties(
    molecule,
    sentinelPredictors(predictors, { logP: -999 }),
  );
  expect(unknownLogP.logP).toBeNull();
  expect(unknownLogP.drugScore).toBeNull();

  const unknownLogS = computeProperties(
    molecule,
    sentinelPredictors(predictors, { logS: -999 }),
  );
  expect(unknownLogS.logS).toBeNull();
  expect(unknownLogS.drugScore).toBeNull();

  const unknownLikeness = computeProperties(
    molecule,
    sentinelPredictors(predictors, { druglikeness: -999 }),
  );
  expect(unknownLikeness.druglikeness).toBeNull();
  expect(unknownLikeness.drugScore).toBeNull();

  const unknownRisk = computeProperties(
    molecule,
    sentinelPredictors(predictors, { risk: 0 }),
  );
  expect(unknownRisk.risks.mutagenic).toBe('unknown');
  expect(unknownRisk.drugScore).toBeNull();
});

test('an unknown polar surface area is -1, and does not refuse the drug score', () => {
  const molecule = predictors.Molecule.fromSmiles(BENZENE);
  const properties = computeProperties(
    molecule,
    sentinelPredictors(predictors, { polarSurfaceArea: -1 }),
  );
  expect(properties.polarSurfaceArea).toBeNull();
  expect(properties.drugScore?.toFixed(2)).toBe('0.06');
});

test('predictIdCode reads the editor value, coordinates and all', () => {
  const bare = predictIdCode('gFp@DiTt@@@', predictors);
  const drawn = predictIdCode('gFp@DiTt@@@ !B?g~w@k_}mwvw?@', predictors);
  expect(bare.idCode).toBe('gFp@DiTt@@@');
  expect(drawn.idCode).toBe('gFp@DiTt@@@');
  expect(drawn.logP).toBe(bare.logP);
});

test('an unreadable idCode fails with a sentence, not a GWT internal', () => {
  // OpenChemLib answers this one with `Cannot set properties of undefined`.
  expect(() => predictIdCode('!!!bad!!!', predictors)).toThrow(
    UNREADABLE_ID_CODE_MESSAGE,
  );
});
