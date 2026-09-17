import { expect, test } from 'vitest';

import { parseRiskFindings, riskDetail } from '../core/index.ts';

import { testPredictors } from './osirisResources.ts';

const predictors = await testPredictors();

function detailOf(smiles: string, risk: 'mutagenic' | 'irritant') {
  return riskDetail(predictors.Molecule.fromSmiles(smiles), risk, predictors);
}

test('aspirin is a known molecule, so there is no fragment to highlight', () => {
  // Its idCode is in the RTECS-derived list `m3.txt`. The one idCode the
  // predictor prints under that heading is the molecule itself, and drawing it
  // highlighted would call the whole compound its own toxicophore.
  const detail = detailOf('CC(=O)Oc1ccccc1C(=O)O', 'mutagenic');

  expect(detail.risk).toBe('mutagenic');
  expect(detail.findings).toHaveLength(1);
  expect(detail.findings[0]).toStrictEqual({
    kind: 'known',
    description: 'This molecule is known to be mutagenic:',
    severity: null,
    idCode: null,
    atoms: [],
    bonds: [],
  });
});

test('benzidine matches a high-risk fragment, located on the molecule', () => {
  const detail = detailOf('Nc1ccc(cc1)-c1ccc(N)cc1', 'mutagenic');

  expect(detail.findings).toHaveLength(1);
  const finding = detail.findings[0];
  expect(finding?.kind).toBe('fragment');
  expect(finding?.severity).toBe('high');
  expect(finding?.description).toBe(
    'High-risk fragments indicating Mutagenicity:',
  );
  expect(finding?.idCode).toBe('dk^@@@RYWYVftx@H@@@H');
  // The fragment matches twice, once from each ring, and the two matches
  // together cover the whole molecule: 14 atoms, 15 bonds.
  expect(finding?.atoms).toStrictEqual([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
  ]);
  expect(finding?.bonds).toStrictEqual([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  ]);
});

test('the matched fragment is a readable query structure', () => {
  const detail = detailOf('Nc1ccc(cc1)-c1ccc(N)cc1', 'mutagenic');
  const fragment = predictors.Molecule.fromIDCode(
    detail.findings[0]?.idCode as string,
  );
  expect(fragment.getAllAtoms()).toBe(13);
  expect(fragment.isFragment()).toBe(true);
});

test('a medium-risk match is told apart from a high-risk one', () => {
  const detail = detailOf('CC(C)CC(C)(C)C', 'irritant');
  expect(detail.findings[0]?.severity).toBe('medium');
  expect(detail.findings[0]?.description).toBe(
    'Medium-risk fragments indicating Irritating effects:',
  );
  expect(detail.findings[0]?.kind).toBe('fragment');
});

test('nothing found says so, and highlights nothing', () => {
  const detail = detailOf('CC', 'mutagenic');
  expect(detail.findings).toStrictEqual([
    {
      kind: 'none',
      description: 'No indication for Mutagenicity found.',
      severity: null,
      idCode: null,
      atoms: [],
      bonds: [],
    },
  ]);
});

test('the molecule the caller owns is left exactly as it was', () => {
  const molecule = predictors.Molecule.fromSmiles('Nc1ccc(cc1)-c1ccc(N)cc1');
  const before = molecule.getIDCode();
  riskDetail(molecule, 'mutagenic', predictors);
  expect(molecule.getIDCode()).toBe(before);
});

test('a high block and a medium block in one list each keep their fragments', () => {
  const findings = parseRiskFindings([
    { type: 2, value: 'High-risk fragments indicating Mutagenicity:' },
    { type: 1, value: 'aaa' },
    { type: 1, value: 'bbb' },
    { type: 2, value: 'Medium-risk fragments indicating Mutagenicity:' },
    { type: 1, value: 'ccc' },
  ]);

  expect(findings).toHaveLength(3);
  expect(findings.map((finding) => finding.idCode)).toStrictEqual([
    'aaa',
    'bbb',
    'ccc',
  ]);
  expect(findings.map((finding) => finding.severity)).toStrictEqual([
    'high',
    'high',
    'medium',
  ]);
});

test('anything else the predictor prints is carried as a note', () => {
  // What a predictor whose tables did not load prints, next to every risk of
  // zero. It must never read as "no risk found".
  expect(
    parseRiskFindings([
      { type: 2, value: 'Toxicity predictor not properly initialized.' },
    ]),
  ).toStrictEqual([
    {
      kind: 'note',
      description: 'Toxicity predictor not properly initialized.',
      severity: null,
      idCode: null,
      atoms: [],
      bonds: [],
    },
  ]);
});

test('an idCode printed with no heading before it is ignored', () => {
  expect(parseRiskFindings([{ type: 1, value: 'aaa' }])).toStrictEqual([]);
});
