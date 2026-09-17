import { aboutProblems, resolveAbout } from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import { ABOUT } from '../about.ts';

test('the About record is short enough for anyone to read it', () => {
  expect(aboutProblems(ABOUT)).toStrictEqual([]);
});

test('what a visitor can do here is five lines, each starting on a verb', () => {
  expect(ABOUT.can).toHaveLength(5);
  expect(ABOUT.can[0]).toBe(
    'Draw one structure and read its four toxicity risks at once.',
  );
  expect(ABOUT.can[4]).toBe('Sort, filter and export the table as TSV.');
});

test('every borrowed work the site runs on is named, and resolves', () => {
  expect(ABOUT.credits).toStrictEqual([
    'openchemlib',
    'osiris-property-explorer',
    'react-ocl',
    'react-mf',
    'blueprint',
    'react-science',
    'react-cheminfo',
    'react',
    'vite',
  ]);

  const about = resolveAbout(ABOUT);

  expect(about.credits.map((credit) => credit.name)).toStrictEqual([
    'OpenChemLib',
    'OSIRIS Property Explorer',
    'react-ocl',
    'react-mf',
    'Blueprint',
    'react-science',
    'react-cheminfo',
    'React',
    'Vite',
  ]);
  expect(about.license).toBe('MIT');
  expect(about.repository).toBe(
    'https://github.com/cheminfo/osiris.cheminfo.org',
  );
  expect(about.issues).toBe(
    'https://github.com/cheminfo/osiris.cheminfo.org/issues',
  );
});

test('the tool this one replaces is credited, with the author who wrote it', () => {
  const credit = resolveAbout(ABOUT).credits.find(
    (entry) => entry.id === 'osiris-property-explorer',
  );

  expect(credit?.name).toBe('OSIRIS Property Explorer');
  expect(credit?.description).toContain('Thomas Sander');
});

test('a prediction is a warning, and nothing leaves the page', () => {
  expect(ABOUT.paragraphs).toHaveLength(2);
  expect(ABOUT.paragraphs?.[0]).toContain('OSIRIS Property Explorer');
  expect(ABOUT.paragraphs?.[1]).toContain('A prediction is a warning');
  expect(ABOUT.paragraphs?.[1]).toContain('nothing you draw or load is sent');
});

test('OSIRIS and the toolkit behind it are what the site asks to be cited', () => {
  expect(ABOUT.cite?.map((work) => work.reference.doi)).toStrictEqual([
    '10.1021/ci800305f',
    '10.1021/ci500588j',
  ]);
  expect(ABOUT.cite?.[0]?.reference.authors[0]).toStrictEqual({
    given: 'T.',
    family: 'Sander',
  });
  expect(ABOUT.cite?.[0]?.reference.year).toBe(2009);
});
