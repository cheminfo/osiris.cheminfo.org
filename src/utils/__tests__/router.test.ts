import { expect, test } from 'vitest';

import { splitPath, splitQuery } from '../address.ts';
import {
  DEFAULT_ROUTE,
  formatRoute,
  parseAddress,
  pathOf,
  routesEqual,
} from '../router.ts';

test('an address names a page, and the explorer is the site root', () => {
  expect(parseAddress('/')).toStrictEqual({ tab: 'explorer', query: {} });
  expect(parseAddress('/compare')).toStrictEqual({ tab: 'compare', query: {} });
  expect(parseAddress('/about/')).toStrictEqual({ tab: 'about', query: {} });
  expect(pathOf('explorer')).toBe('/');
  expect(pathOf('compare')).toBe('/compare');
});

test('an address the site cannot read opens the explorer rather than throwing', () => {
  expect(parseAddress('')).toStrictEqual(DEFAULT_ROUTE);
  expect(parseAddress('/nope/deeper')).toStrictEqual(DEFAULT_ROUTE);
  expect(parseAddress('/?broken=%')).toStrictEqual({
    tab: 'explorer',
    query: { broken: '%' },
  });
});

test('a fragment from the old view is read as the path it names', () => {
  expect(parseAddress('#/compare')).toStrictEqual({
    tab: 'compare',
    query: {},
  });
});

test('a route is serialised into the address that parses back to it', () => {
  expect(formatRoute({ tab: 'explorer', query: {} })).toBe('/');
  expect(formatRoute({ tab: 'compare', query: { axes: 'logP,logS' } })).toBe(
    '/compare?axes=logP,logS',
  );
  expect(
    formatRoute({ tab: 'explorer', query: { smiles: 'CC[N+](C)(C)C' } }),
  ).toBe('/?smiles=CC%5BN%2B%5D(C)(C)C');
});

test('two routes carrying the same thing compare equal', () => {
  expect(
    routesEqual(
      { tab: 'compare', query: { axes: 'logP' } },
      { tab: 'compare', query: { axes: 'logP' } },
    ),
  ).toBe(true);
  expect(
    routesEqual({ tab: 'compare', query: {} }, { tab: 'explorer', query: {} }),
  ).toBe(false);
});

test('an address is cut at its question mark, hash or no hash', () => {
  expect(splitQuery('/compare?a=1')).toStrictEqual({
    path: '/compare',
    search: 'a=1',
  });
  expect(splitQuery('#/compare?a=1')).toStrictEqual({
    path: '/compare',
    search: 'a=1',
  });
  expect(splitQuery('/compare')).toStrictEqual({
    path: '/compare',
    search: '',
  });
  expect(splitPath('//compare//')).toStrictEqual(['compare']);
});
