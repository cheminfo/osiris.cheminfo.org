/**
 * `/method` — Thomas Sander's description of the predictions, carried by this
 * site rather than framed from somebody else's.
 *
 * What is checked here is that the document arrived whole: his name on it, the
 * link back to where it was published, every section, and every figure
 * actually fetched rather than shown as a broken image. `e2e/mounted.spec.ts`
 * then checks the same figures under a mount path, which is where an address
 * written from the root of the host would show.
 */

import { expect, test } from '@playwright/test';

import { METHOD_FIGURES } from '../src/method/figures.ts';

/* eslint-disable no-await-in-loop -- a browser does one thing at a time, and so
   does a reader: each figure is scrolled to and then looked at, in order. */

/** The sections of the document, in the order it carries them. */
const SECTIONS = [
  'Toxicity Risk Assessment',
  'cLogP Calculation',
  'logS Calculation',
  'Molecular Weight',
  'Fragment Based Druglikeness',
  'Drug Score',
];

test('the document says whose it is, and links back to where it was published', async ({
  page,
}) => {
  await page.goto('/method');

  await expect(page.locator('.method-attribution')).toContainText(
    'Thomas Sander wrote this description of the OSIRIS Property Explorer at Actelion Pharmaceuticals Ltd. (now Idorsia), Allschwil, Switzerland.',
  );
  // And his own byline, inside the document, where he put it.
  await expect(
    page.getByText(
      'Thomas Sander, Actelion Pharmaceuticals Ltd., Gewerbestrasse 16, 4123 Allschwil, Switzerland.',
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'the original page' }),
  ).toHaveAttribute(
    'href',
    'https://cheminfo.github.io/www.c6h6.org/molecules/propertyExplorer/',
  );
  await expect(
    page.getByRole('link', { name: 'cheminfo/www.c6h6.org' }),
  ).toHaveAttribute('href', 'https://github.com/cheminfo/www.c6h6.org');
});

test('every section of the document is on the page', async ({ page }) => {
  await page.goto('/method');

  await expect(
    page.getByRole('heading', { name: 'OSIRIS Property Explorer' }),
  ).toBeVisible();
  for (const section of SECTIONS) {
    await expect(
      page.getByRole('heading', { name: section, exact: true }),
    ).toBeVisible();
  }
});

test('the nine figures are fetched, named and sized', async ({ page }) => {
  await page.goto('/method');

  const figures = page.locator('img.method-figure');
  await expect(figures).toHaveCount(METHOD_FIGURES.length);

  for (const [index, figure] of METHOD_FIGURES.entries()) {
    const image = figures.nth(index);
    await expect(image).toHaveAttribute('alt', figure.alt);
    await expect(image).toHaveAttribute('loading', 'lazy');
    // Lazily loaded, so it is only fetched once the reader reaches it.
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(async () =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth,
        ),
      )
      .toBe(figure.width);
  }
});

test('the raw HTML the document carries survives, sanitised', async ({
  page,
}) => {
  await page.goto('/method');

  // `log(c_octanol / c_water)`: the source writes the two subscripts as <sub>,
  // and a renderer that dropped raw HTML would run the three words together.
  await expect(page.locator('.method-page sub').first()).toHaveText('octanol');
  await expect(page.locator('.method-page script')).toHaveCount(0);
});

test('an embedded /method is the document alone', async ({ page }) => {
  await page.goto('/method?embed=1');

  await expect(page.getByTestId('page-method')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Drug Score', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('banner')).toHaveCount(0);
  await expect(page.getByRole('contentinfo')).toHaveCount(0);
});

test('printing /method leaves the chrome out and keeps the document', async ({
  page,
}) => {
  await page.goto('/method');
  await page.emulateMedia({ media: 'print' });

  await expect(page.getByRole('banner')).toBeHidden();
  await expect(page.getByRole('contentinfo')).toBeHidden();
  await expect(
    page.getByRole('heading', { name: 'Toxicity Risk Assessment' }),
  ).toBeVisible();
});
