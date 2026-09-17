/**
 * The explorer at `/`: what a link carrying a structure actually puts on the
 * screen.
 *
 * The numbers are not invented for the test. Every one of them was read off
 * OpenChemLib for benzene and matches the original OSIRIS panel's own
 * screenshot to the last digit — cLogP 1.66, solubility −1.62, molweight 78.11,
 * TPSA 0.00, drug-likeness −4.84, drug score 0.06 — so a change anywhere from
 * the resource files to the worker to the formatter fails here rather than
 * shipping a plausible wrong panel.
 *
 * Benzene is red on all four risks, which is right and looks alarming: its
 * idCode is in all four RTECS-derived known-molecule lists. The page has to say
 * which branch fired, and that is asserted too.
 *
 * These run against `npm run preview`, i.e. the built site, so the prediction
 * worker, the resource file it registers and the mount-relative addresses are
 * the real ones.
 */

import { expect, test } from '@playwright/test';

/** Benzene, in the panel's order. The prediction is worth waiting for. */
const BENZENE = [
  '1.66',
  '-1.62',
  '78.11',
  '0.00',
  '-4.84',
  '0',
  '0',
  '0',
  '0',
  '0.06',
];

/** A prediction is a worker start-up, a resource fetch and about 300 ms of work. */
const PREDICTED = { timeout: 30_000 };

test('nothing drawn shows what to do, not a blank panel', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Draw a molecule, or open one')).toBeVisible();
  await expect(page.getByRole('link', { name: 'benzene' })).toHaveAttribute(
    'href',
    '/?smiles=c1ccccc1',
  );
  // The ten rows stand with their names and no values, so nothing moves under
  // the reader's eye once a structure arrives.
  await expect(page.getByText('cLogP')).toBeVisible();
  await expect(page.locator('.property-row__value').first()).toHaveText('–');
});

test('?smiles= loads the molecule and predicts every number it shows', async ({
  page,
}) => {
  await page.goto('/?smiles=c1ccccc1');

  await expect(page.locator('.property-row__value')).toHaveText(
    BENZENE,
    PREDICTED,
  );
  // The formula is rendered, never printed as a raw string.
  await expect(page.locator('.property-panel__head sub').first()).toHaveText(
    '6',
  );
});

test('an idCode in the address wins over the SMILES beside it', async ({
  page,
}) => {
  await page.goto('/?idcode=gFp@DiTt@@@&smiles=CCO');

  await expect(page.locator('.property-row__value')).toHaveText(
    BENZENE,
    PREDICTED,
  );
});

test('a structure that cannot be read says so, and predicts nothing', async ({
  page,
}) => {
  await page.goto('/?smiles=c1ccccc');

  await expect(page.getByText('Dangling ring closure')).toBeVisible(PREDICTED);
  await expect(page.locator('.property-row__value').first()).toHaveText('–');
});

test('a red square says which branch of the predictor fired', async ({
  page,
}) => {
  await page.goto('/?smiles=c1ccccc1');

  const square = page.getByRole('button', { name: /Mutagenicity/ });
  await expect(square).toContainText('High risk', PREDICTED);

  await square.click();
  await expect(page.getByText('known to be mutagenic')).toBeVisible(PREDICTED);
  // The known-molecule branch has no fragment, so nothing is highlighted and
  // the page says why rather than painting the whole molecule.
  await expect(
    page.getByText('This exact compound is on the list'),
  ).toBeVisible();
});

test('?hide=detail keeps the squares and drops the explanation', async ({
  page,
}) => {
  await page.goto('/?smiles=c1ccccc1&hide=detail');

  const square = page.getByRole('button', { name: /Mutagenicity/ });
  await expect(square).toContainText('High risk', PREDICTED);

  await square.click();
  await expect(page.getByText('known to be mutagenic')).toHaveCount(0);
});
