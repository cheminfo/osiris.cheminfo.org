/**
 * What every site of the family promises: the tool works at `/`, the About is
 * a page of its own, `?embed` keeps the tool and drops the chrome, and every
 * routed address is served with its own head.
 *
 * The addresses come from `PAGE_ROUTES`, the table the build prerenders, so a
 * page added there is checked here without editing this file.
 *
 * These run against `npm run preview`, i.e. the built site — see
 * `playwright.config.ts`. `vite dev` fills every address with the home page's
 * head, so the same assertions there would test the client's correction rather
 * than the head a crawler is handed.
 */

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { PAGE_ROUTES } from '../src/seo/routes.ts';
import { configuredSiteUrl } from '../src/state/site.ts';

/** What the tab writes after the page's own title, on every address. */
const TITLE_SUFFIX = ' — osiris.cheminfo.org';

/** Where the site says it is published, as the canonical links write it. */
const SITE_URL = configuredSiteUrl().replace(/\/$/, '');

test('the explorer is what / renders, with its panels named', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByTestId('page-explorer')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Predicted toxicity risks' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Predicted properties' }),
  ).toBeVisible();
});

test('the comparison page is where a whole set is read', async ({ page }) => {
  await page.goto('/compare');

  await expect(page.getByTestId('page-compare')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Parallel coordinates' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The set' })).toBeVisible();
});

test('the brand, the pages and the utilities are where the family puts them', async ({
  page,
}) => {
  await page.goto('/');
  const header = page.getByRole('banner');

  await expect(
    header.getByRole('link', { name: /osiris/ }).first(),
  ).toHaveAttribute('href', '/');
  await expect(header.getByRole('link', { name: 'Compare' })).toHaveAttribute(
    'href',
    '/compare',
  );
  await expect(header.getByRole('link', { name: 'Method' })).toHaveAttribute(
    'href',
    '/method',
  );
  await expect(header.getByRole('link', { name: 'About' })).toHaveAttribute(
    'href',
    '/about',
  );
  await expect(
    header.locator('button').filter({ hasText: /^Cite$/ }),
  ).toBeVisible();
  await expect(
    header.locator('button').filter({ hasText: /^Share$/ }),
  ).toBeVisible();
});

test('/about is the About page, under the header and above the footer', async ({
  page,
}) => {
  await page.goto('/about');

  await expect(
    page.getByRole('main').getByRole('heading', { level: 1 }),
  ).toHaveText('osiris.cheminfo');
  await expect(
    page
      .getByRole('banner')
      .locator('button')
      .filter({ hasText: /^Cite$/ }),
  ).toBeVisible();
  const footer = page.getByRole('contentinfo');
  await expect(footer).toBeVisible();
  await expect(footer.locator('h2')).toHaveText('Our other tools');
});

for (const query of ['?embed', '?embed=1']) {
  test(`/${query} drops the header and the footer, and the tool still renders`, async ({
    page,
  }) => {
    await page.goto(`/${query}`);

    // Wait for the tool before asserting what is absent, so an unmounted page
    // cannot pass.
    await expect(page.getByTestId('page-explorer')).toBeVisible();
    await expect(page.getByRole('banner')).toHaveCount(0);
    await expect(page.getByRole('contentinfo')).toHaveCount(0);
  });
}

test('?hide= leaves out the part it names, and keeps the rest', async ({
  page,
}) => {
  await page.goto('/?embed=1&hide=risks');

  await expect(
    page.getByRole('heading', { name: 'Predicted properties' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Predicted toxicity risks' }),
  ).toHaveCount(0);
});

test('the share dialog opens on the link a course page would want', async ({
  page,
}) => {
  await page.goto('/compare?smiles=CCO');

  await page
    .getByRole('banner')
    .locator('button')
    .filter({ hasText: /^Share$/ })
    .click();

  // Framed, with the parts a host page has no use for already off — and the
  // molecule carried through, because the set is the tool's input rather than
  // something the dialog configures.
  const link = page.getByRole('button', { name: 'Open in a new tab' });
  await expect(link).toHaveAttribute('href', /[?&]embed=1/);
  await expect(link).toHaveAttribute('href', /[?&]hide=fileInput,download/);
  await expect(link).toHaveAttribute('href', /[?&]smiles=CCO/);
});

for (const route of PAGE_ROUTES) {
  test(`${route.path} is served with its own head`, async ({ request }) => {
    // The bytes off the wire, never the DOM: the client rewrites the head a
    // moment after the page loads, so a `toHaveTitle` here would pass on the
    // home page's head and say nothing about what a crawler was handed.
    const response = await request.get(route.path);

    expect(response.status(), route.path).toBe(200);
    const html = await response.text();
    expect(html).toContain(`<title>${route.title}${TITLE_SUFFIX}</title>`);
    expect(html).toContain(
      `<meta name="description" content="${route.description}" />`,
    );
    expect(html).toContain(
      `<link rel="canonical" href="${SITE_URL}${route.path}" />`,
    );
  });

  test(`${route.path} loads cleanly`, async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto(route.path);

    await expect(page).toHaveTitle(route.title + TITLE_SUFFIX);
    await expect(page.getByRole('main')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(errors).toStrictEqual([]);
  });
}

test('a crawler with no JavaScript is handed a path through the site', async ({
  page,
}) => {
  const response = await page.goto('/');
  const html = (await response?.text()) ?? '';

  expect(html).toContain('<noscript>');
  for (const route of PAGE_ROUTES) {
    expect(html).toContain(route.short ?? route.title);
  }
});

/**
 * Record every uncaught exception and every `console.error` of a page.
 * @param page - The page under test.
 * @returns The list the messages are appended to, as they happen.
 */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}
