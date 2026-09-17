/**
 * The site served as one tool among several on a shared host.
 *
 * `scripts/__tests__/mountPath.test.ts` reads the built markup back and proves
 * nothing in it starts at the root of the host. This is the other half: the
 * addresses the running page computes — every figure of `/method`, the script,
 * the stylesheet, the icon — are only right if `withBase()` was used, and the
 * only way to know is to open the mounted build and watch what it fetched.
 *
 * It runs against the second preview server `playwright.config.ts` starts,
 * which serves `dist-mount` at `/osiris/` the way the container does: one file
 * per routed address, no single-page fallback.
 */

import { expect, test } from '@playwright/test';

import { MOUNT_PATH, MOUNT_PREVIEW_PORT } from '../scripts/mountedSite.ts';
import { METHOD_FIGURES } from '../src/method/figures.ts';
import { PAGE_ROUTES } from '../src/seo/routes.ts';

/* eslint-disable no-await-in-loop -- a browser does one thing at a time, and so
   does a reader: each figure is scrolled to and then looked at, in order. */

/** Where the mounted copy answers while this spec runs. */
const MOUNTED = `http://localhost:${MOUNT_PREVIEW_PORT}${MOUNT_PATH}`;

test('every figure of the method page answers 200 under the mount path', async ({
  request,
}) => {
  for (const figure of METHOD_FIGURES) {
    const response = await request.get(`${MOUNTED}/method/${figure.file}`);
    expect(response.status(), `${MOUNT_PATH}/method/${figure.file}`).toBe(200);
    expect(response.headers()['content-type']).toBe('image/gif');
  }
});

test('the mounted method page asks for its figures under the mount, and gets them', async ({
  page,
}) => {
  const missing: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) {
      missing.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(`${MOUNTED}/method`);
  await expect(page.getByTestId('page-method')).toBeVisible();

  const figures = page.locator('img.method-figure');
  await expect(figures).toHaveCount(METHOD_FIGURES.length);
  for (const [index, figure] of METHOD_FIGURES.entries()) {
    const image = figures.nth(index);
    await expect(image).toHaveAttribute(
      'src',
      `${MOUNT_PATH}/method/${figure.file}`,
    );
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

  await page.waitForLoadState('networkidle');
  expect(missing).toStrictEqual([]);
});

test('the mount is where the pages say they are, and the nav keeps it', async ({
  page,
}) => {
  // The chrome is the family's, not this site's, so it is checked here too: the
  // script, the stylesheet and the icon are all addresses under the mount.
  const missing: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) {
      missing.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(`${MOUNTED}/`);

  await expect(page.getByTestId('page-explorer')).toBeVisible();
  const header = page.getByRole('banner');
  await expect(header.getByRole('link', { name: 'Method' })).toHaveAttribute(
    'href',
    `${MOUNT_PATH}/method`,
  );

  await header.getByRole('link', { name: 'Method' }).click();
  await expect(page.getByTestId('page-method')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(`${MOUNT_PATH}/method`);

  await page.waitForLoadState('networkidle');
  expect(missing).toStrictEqual([]);
});

for (const route of PAGE_ROUTES) {
  test(`${route.path} is served under the mount with its own head`, async ({
    request,
  }) => {
    const address = route.path === '/' ? `${MOUNTED}/` : MOUNTED + route.path;
    const response = await request.get(address);

    expect(response.status(), address).toBe(200);
    const html = await response.text();
    expect(html).toContain(`<base href="${MOUNT_PATH}/" />`);
    expect(html).toContain(`<title>${route.title} — osiris.cheminfo.org`);
  });
}

test('an address this site does not serve is not quietly the home page', async ({
  request,
}) => {
  // The build writes a file per routed address and the container serves them as
  // they stand, so a fallback here would hide a page that failed to prerender.
  const response = await request.get(`${MOUNTED}/not-a-page`);

  expect(response.status()).toBe(404);
});

test('the prediction runs under the mount, resources and worker included', async ({
  page,
}) => {
  // The one address a worker cannot work out for itself: it has no `document`,
  // so the resource file's URL is resolved on the main thread off the `<base>`
  // the container stamped in. Get it wrong and every risk quietly comes back
  // unassessed, with nothing on the page saying why — so the check is the six
  // numbers, not the fetch.
  const missing: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) {
      missing.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(`${MOUNTED}/?smiles=c1ccccc1`);

  await expect(page.locator('.property-row__value')).toHaveText(
    ['1.66', '-1.62', '78.11', '0.00', '-4.84', '0', '0', '0', '0', '0.06'],
    { timeout: 30_000 },
  );
  await expect(
    page.getByRole('button', { name: /Mutagenicity/ }),
  ).toContainText('High risk');

  await page.waitForLoadState('networkidle');
  expect(missing).toStrictEqual([]);
});
