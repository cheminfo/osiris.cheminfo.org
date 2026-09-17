/**
 * The About page: what the site is, what it can do, what it borrows, how to
 * cite it and under which licence.
 *
 * Every string asserted here is a string of `src/about.ts`, so the page and the
 * record it is drawn from cannot drift apart — and a section the shared
 * `AboutPage` stops rendering is caught rather than silently lost.
 */

import { expect, test } from '@playwright/test';

/** The five things `ABOUT.can` says a visitor can do here. */
const CAN = [
  'Draw one structure and read its four toxicity risks at once.',
  'Read cLogP, logS, TPSA, molweight and the drug score as you draw.',
  'Load an SDF file, a SMILES list or pasted SMILES and compare them in a table.',
  'Plot every property of a set on parallel coordinates and brush the ranges.',
  'Sort, filter and export the table as TSV.',
];

/** Every borrowed work `ABOUT.credits` names, in the order it names them. */
const CREDIT_NAMES = [
  'OpenChemLib',
  'OSIRIS Property Explorer',
  'react-ocl',
  'react-mf',
  'Blueprint',
  'react-science',
  'react-cheminfo',
  'React',
  'Vite',
];

test('the About answers on its own address, naming the site and what it is for', async ({
  page,
}) => {
  await page.goto('/about');

  await expect(page).toHaveTitle(
    'About — what this tool predicts and what it borrows — osiris.cheminfo.org',
  );
  const hero = page.locator('.about-hero');
  await expect(hero.locator('h1')).toHaveText('osiris.cheminfo');
  await expect(hero).toContainText(
    'Draw a molecule and read its predicted toxicity risks, physicochemical properties and drug score.',
  );
});

test('the sections are the ones the family writes, in the family order', async ({
  page,
}) => {
  await page.goto('/about');

  await expect(page.locator('.about-page h2')).toHaveText([
    'Provided by',
    'What you can do here',
    'Built on',
    'How to cite',
    'Licence and source',
    'Found a problem?',
  ]);
});

test('what you can do here is the five things the record lists', async ({
  page,
}) => {
  await page.goto('/about');

  await expect(page.locator('.about-can li')).toHaveText(CAN);
});

test('every borrowed work is credited, licence included where it has one', async ({
  page,
}) => {
  await page.goto('/about');

  await expect(page.locator('.about-credits li a')).toHaveText(CREDIT_NAMES);
  // Naming the licence beside the work is what makes the list a credit rather
  // than a list of links, and it is the part a site forgets when it writes its
  // own page.
  await expect(page.locator('.about-credits li').first()).toContainText(
    'BSD-3-Clause',
  );
  // The tool this one replaces, and the person who wrote it.
  await expect(page.locator('.about-credits li').nth(1)).toContainText(
    'Thomas Sander',
  );
});

test('the honest sentence about what a prediction is worth is on the page', async ({
  page,
}) => {
  await page.goto('/about');

  await expect(page.locator('.about-page')).toContainText(
    'A prediction is a warning, not a verdict.',
  );
  await expect(page.locator('.about-page')).toContainText(
    'nothing you draw or load is sent anywhere',
  );
});

test('OSIRIS is what the site asks to be cited, with its DOI', async ({
  page,
}) => {
  await page.goto('/about');

  const cite = page.locator('.about-cite');
  await expect(cite).toContainText('The OSIRIS property predictions');

  // The page names the work; its reference is what its Cite button opens.
  await cite
    .getByRole('button', {
      name: 'Cite The OSIRIS property predictions',
      exact: true,
    })
    .click();
  const doi = page.locator('.citation-menu a[href^="https://doi.org/"]');
  await expect(doi).toHaveAttribute(
    'href',
    'https://doi.org/10.1021/ci800305f',
  );
  await expect(doi).toContainText('10.1021/ci800305f');
});

test('the licence and the sources are named, and the issue tracker with them', async ({
  page,
}) => {
  await page.goto('/about');

  const licence = page.locator('.about-licence');
  await expect(licence).toContainText('MIT, © cheminfo.');
  await expect(
    licence.getByRole('link', {
      name: 'github.com/cheminfo/osiris.cheminfo.org',
    }),
  ).toHaveAttribute('href', 'https://github.com/cheminfo/osiris.cheminfo.org');
  await expect(page.locator('.about-issues').getByRole('link')).toHaveAttribute(
    'href',
    'https://github.com/cheminfo/osiris.cheminfo.org/issues',
  );
});

test('the About says which build is running', async ({ page }) => {
  await page.goto('/about');

  await expect(page.locator('.about-licence')).toContainText(
    /Running version \d+\.\d+\.\d+/,
  );
});
