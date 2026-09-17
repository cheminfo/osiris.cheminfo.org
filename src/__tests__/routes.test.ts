import { assertRoutes, pageMetaFor } from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import { FIXED_ROUTES, NOSCRIPT_ROUTES, PAGE_ROUTES } from '../seo/routes.ts';

test('the pages that exist whatever the data says are these four', () => {
  expect(FIXED_ROUTES.map((route) => route.path)).toStrictEqual([
    '/',
    '/compare',
    '/method',
    '/about',
  ]);
  expect(NOSCRIPT_ROUTES).toStrictEqual(FIXED_ROUTES);
  expect(PAGE_ROUTES.slice(0, FIXED_ROUTES.length)).toStrictEqual(FIXED_ROUTES);
});

test('the route table is one a crawler can be handed', () => {
  expect(() => {
    assertRoutes(PAGE_ROUTES);
  }).not.toThrow();
});

test('no two pages carry the same title or the same description', () => {
  const titles = new Set(PAGE_ROUTES.map((route) => route.title));
  const descriptions = new Set(PAGE_ROUTES.map((route) => route.description));

  expect(titles.size).toBe(PAGE_ROUTES.length);
  expect(descriptions.size).toBe(PAGE_ROUTES.length);
});

test('a description is a sentence a search result shows whole', () => {
  for (const route of PAGE_ROUTES) {
    expect(route.description.length).toBeGreaterThanOrEqual(110);
    expect(route.description.length).toBeLessThanOrEqual(160);
    expect(route.title.length).toBeLessThanOrEqual(60);
    expect(route.description).not.toContain('[[');
  }
});

test('the crawl path reads as a menu, not as a list of search results', () => {
  expect(NOSCRIPT_ROUTES.map((route) => route.short)).toStrictEqual([
    'Explorer',
    'Compare',
    'Method',
    'About',
  ]);
});

test('an address the site does not know is described as the home page', () => {
  expect(pageMetaFor(PAGE_ROUTES, '/not-a-page').path).toBe('/');
  expect(pageMetaFor(PAGE_ROUTES, '/compare/CCO').path).toBe('/');
});

test('what the tool is working on is never a page of its own', () => {
  expect(pageMetaFor(PAGE_ROUTES, '/?smiles=c1ccccc1').path).toBe('/');
  expect(pageMetaFor(PAGE_ROUTES, '/compare?smiles=CCO&embed').path).toBe(
    '/compare',
  );
  expect(pageMetaFor(PAGE_ROUTES, '/about/').path).toBe('/about');
});
