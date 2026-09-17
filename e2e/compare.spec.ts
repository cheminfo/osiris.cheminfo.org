/**
 * `/compare`: a set read from a link or pasted in, predicted one molecule at a
 * time, and then filtered by brushing an axis of the plot.
 *
 * The numbers are not invented. Benzene's cLogP is 1.66 and its molweight
 * 78.11, aspirin's 180.16 and caffeine's 194.19 — the same values the panel
 * shows on the explorer, read off OpenChemLib. A change anywhere from the
 * worker to the table's formatter fails here.
 *
 * These run against `npm run preview`, i.e. the built site, so the prediction
 * workers, the resource file they register and the mount-relative addresses
 * are the real ones.
 */

import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

/** Benzene, aspirin and caffeine, in that order. */
const THREE = 'c1ccccc1,CC(=O)Oc1ccccc1C(=O)O,Cn1cnc2c1c(=O)n(C)c(=O)n2C';

/** A set of three is three worker start-ups and about a second of work. */
const PREDICTED = { timeout: 45_000 };

test('nothing loaded says what to do, and offers a set to open', async ({
  page,
}) => {
  await page.goto('/compare');

  await expect(page.getByText('Nothing to compare yet')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'five common drugs' }),
  ).toBeVisible();
});

test('a link carrying a set loads it, and every row fills in', async ({
  page,
}) => {
  await page.goto(`/compare?smiles=${THREE}`);

  const rows = page.locator('.compare-row');
  await expect(rows).toHaveCount(3);
  // The rows stand before their numbers do.
  await expect(page.locator('.compare-kept')).toContainText('3 molecules');
  await expect(
    rows.first().locator('.compare-cell__number').first(),
  ).toHaveText('1.66', PREDICTED);
  await expect(rows.nth(2).locator('.compare-cell__number').nth(2)).toHaveText(
    '194.19',
    PREDICTED,
  );
});

test('the example set is a link a teacher can read out loud', async ({
  page,
}) => {
  await page.goto('/compare');

  const link = page.getByRole('link', { name: 'five common drugs' });

  // A comma stays a comma, which is how every sibling writes a list.
  const href = await link.getAttribute('href');
  expect(href).not.toContain('%2C');
  expect(href?.split(',')).toHaveLength(5);
});

test('a pasted list is added to the set', async ({ page }) => {
  await page.goto('/compare');

  await page.locator('.compare-paste').fill('CCO\nc1ccccc1 benzene');
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  await expect(page.locator('.compare-row')).toHaveCount(2);
  await expect(page.locator('.compare-row').nth(1)).toContainText('benzene');
  await expect(
    page
      .locator('.compare-row')
      .nth(1)
      .locator('.compare-cell__number')
      .first(),
  ).toHaveText('1.66', PREDICTED);
});

test('a set of one molecule says so in the singular', async ({ page }) => {
  await page.goto('/compare?smiles=CCO');

  await expect(page.locator('.compare-row')).toHaveCount(1);
  await expect(page.locator('.compare-kept')).toHaveText('1 molecule');
  await expect(page.locator('.compare-download h5')).toHaveText(
    'Download 1 molecule',
  );
});

test('a reload brings back the set under the names it was read with', async ({
  page,
}) => {
  await page.goto('/compare');
  await page
    .locator('.compare-paste')
    .fill('CCO ethanol\nc1ccccc1 benzene\nCC(=O)O acetic acid');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.locator('.compare-row')).toHaveCount(3);

  // The address carries the structures and no names, so a page rebuilt from it
  // alone comes back with three rows called after their own SMILES — and then
  // stores that over the names.
  await page.reload();

  const rows = page.locator('.compare-row');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('ethanol');
  await expect(rows.nth(1)).toContainText('benzene');
  await expect(rows.nth(2)).toContainText('acetic acid');
});

test('turning the last column off leaves it off, and the address says so', async ({
  page,
}) => {
  await page.goto(`/compare?smiles=${THREE}&axes=logP`);
  const active = page.locator('.axis-tag[data-active="true"]');
  await expect(active).toHaveCount(1);

  await active.first().click();

  await expect(active).toHaveCount(0);
  await expect(page).toHaveURL(/axes=none/);
  await expect(page.getByText('Choose at least two columns')).toBeVisible();
});

test('brushing the top of the molweight axis keeps the heaviest molecule alone', async ({
  page,
}) => {
  await page.goto(`/compare?smiles=${THREE}`);
  // The axis is drawn over the values, so the set has to be predicted first.
  await expect(
    page
      .locator('.compare-row')
      .first()
      .locator('.compare-cell__number')
      .first(),
  ).toHaveText('1.66', PREDICTED);

  const axis = page.locator('[data-parallel-brush="molecularWeight"]');
  // `boundingBox` reports viewport coordinates and does not scroll, so the
  // figure has to be on screen before the drag is aimed at it.
  await axis.scrollIntoViewIfNeeded();
  const box = await axis.boundingBox();
  expect(box).not.toBeNull();
  const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
  const top = box?.y ?? 0;

  // Upward, releasing above the axis: the press has to land on the axis, and
  // the band then clamps to its very top, so the heaviest molecule is inside
  // it. Thirty pixels of a 292-pixel axis is about twelve g/mol here, so
  // caffeine's 194.19 is kept and aspirin's 180.16 is not.
  await page.mouse.move(x, top + 30);
  await page.mouse.down();
  await page.mouse.move(x, top - 20, { steps: 6 });
  await page.mouse.up();

  await expect(page.locator('.compare-kept')).toContainText(
    '1 of 3 molecules kept',
  );
  await expect(page.locator('.compare-row')).toHaveCount(1);
  await expect(page.locator('.compare-row')).toContainText('194.19');

  await page.getByRole('button', { name: 'Clear the brushes' }).click();
  await expect(page.locator('.compare-row')).toHaveCount(3);
});

test('the address says which columns the plot draws, and what colours the lines', async ({
  page,
}) => {
  await page.goto(
    `/compare?smiles=${THREE}&axes=logP,drugScore&color=drugScore`,
  );

  await expect(page.locator('[data-parallel-axis]')).toHaveCount(2);
  await expect(page.locator('[data-parallel-axis="logP"]')).toBeVisible();
  await expect(page.locator('[data-parallel-axis="drugScore"]')).toBeVisible();
  await expect(page.locator('#compare-color-by')).toHaveValue('drugScore');
  // An axis the tool does not know is ignored rather than drawn blank, and one
  // column alone has nothing to be drawn against.
  await page.goto(`/compare?smiles=${THREE}&axes=logP,nonsense`);
  await expect(page.getByText('Choose at least two columns')).toBeVisible();
});

test('picking a row shows its properties in the panel', async ({ page }) => {
  await page.goto(`/compare?smiles=${THREE}`);
  await expect(
    page
      .locator('.compare-row')
      .first()
      .locator('.compare-cell__number')
      .first(),
  ).toHaveText('1.66', PREDICTED);

  await page.locator('.compare-row').first().click();

  await expect(
    page.getByRole('heading', { name: 'Predicted properties' }),
  ).toBeVisible();
  await expect(page.locator('.property-row__value').first()).toHaveText('1.66');
  await expect(page).toHaveURL(/focus=/);
});

test('the set downloads as a table holding every predicted number', async ({
  page,
}) => {
  await page.goto(`/compare?smiles=${THREE}`);
  await expect(
    page
      .locator('.compare-row')
      .first()
      .locator('.compare-cell__number')
      .first(),
  ).toHaveText('1.66', PREDICTED);

  const started = page.waitForEvent('download');
  await page.getByRole('button', { name: 'TSV' }).click();
  const download = await started;
  const text = await readFile(await download.path(), 'utf8');
  const lines = text.trim().split('\n');

  expect(download.suggestedFilename()).toBe('the link.tsv');
  expect(lines[0]?.split('\t', 1)[0]).toBe('Name');
  expect(lines).toHaveLength(4);
  expect(lines[1]).toContain('\t1.66\t');
});

test('?embed drops the chrome and keeps the set', async ({ page }) => {
  await page.goto(`/compare?embed=1&smiles=${THREE}`);

  await expect(page.getByTestId('page-compare')).toBeVisible();
  await expect(page.locator('.compare-row')).toHaveCount(3);
  await expect(page.getByRole('banner')).toHaveCount(0);
  await expect(page.getByRole('contentinfo')).toHaveCount(0);
});

test('?hide= leaves out the part it names', async ({ page }) => {
  await page.goto(`/compare?embed=1&hide=plot,table&smiles=${THREE}`);

  await expect(
    page.getByRole('heading', { name: 'Parallel coordinates' }),
  ).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'The set' })).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Predicted properties' }),
  ).toBeVisible();
});
