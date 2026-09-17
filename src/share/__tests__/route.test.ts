import { beforeEach, expect, test } from 'vitest';

import { axisKeysOf } from '../../components/compare/compareAxes.ts';
import { state } from '../../state/index.ts';
import { formatRoute, parseAddress } from '../../utils/router.ts';
import { applyRoute, currentRoute, parseKeys } from '../route.ts';

/** The address the state says it is on, in its canonical form. */
function address(): string {
  return formatRoute(currentRoute());
}

/** Apply an address exactly as the shell does on load or on a back button. */
function open(value: string): string {
  applyRoute(parseAddress(value));
  return address();
}

beforeEach(() => {
  open('/');
});

test('a plain visit keeps a plain address', () => {
  expect(open('/')).toBe('/');
  expect(open('/compare')).toBe('/compare');
  expect(open('/method')).toBe('/method');
  expect(open('/about')).toBe('/about');
});

test('an address the site does not know opens the explorer', () => {
  expect(open('/no/such/page')).toBe('/');
  expect(open('/explorer')).toBe('/');
});

test('the molecule the explorer is on survives parse, apply and parse', () => {
  expect(open('/?smiles=c1ccccc1')).toBe('/?smiles=c1ccccc1');
  // The `@` of an idCode is written back percent-encoded, which is the one
  // canonical form the whole family serialises a query in.
  expect(open('/?idcode=gFp@DiTt@@@')).toBe('/?idcode=gFp%40DiTt%40%40%40');
});

test('a charged molecule is not silently turned into another one', () => {
  open('/?smiles=CC[N%2B](C)(C)C');

  expect(state.view.explorer.smiles.value).toBe('CC[N+](C)(C)C');
  expect(address()).toContain('CC%5BN%2B%5D(C)(C)C');
});

test('an idCode wins over a SMILES, because it is the exact structure', () => {
  open('/?smiles=c1ccccc1&idcode=gFp@DiTt@@@');

  expect(state.view.explorer.idCode.value).toBe('gFp@DiTt@@@');
  expect(state.view.explorer.smiles.value).toBe('');
  expect(address()).toBe('/?idcode=gFp%40DiTt%40%40%40');
});

test('the whole comparison is in the address, set, axes, colour and focus', () => {
  const asked = '/compare?smiles=CCO,c1ccccc1&axes=logP,logS&color=drugScore';

  expect(open(asked)).toBe(asked);
  expect(state.view.compare.axes.value).toStrictEqual(['logP', 'logS']);
  expect(state.view.compare.colorBy.value).toBe('drugScore');
  expect(open('/compare?focus=gFp@DiTt@@@')).toBe(
    '/compare?focus=gFp%40DiTt%40%40%40',
  );
});

test('a plot with every column turned off is an address of its own', () => {
  // "The reader turned them all off" and "the address named none" are two
  // states, and only one of them opens on the seven defaults.
  expect(open('/compare?axes=none')).toBe('/compare?axes=none');
  expect(axisKeysOf(state.view.compare.axes.value)).toStrictEqual([]);

  expect(open('/compare')).toBe('/compare');
  expect(axisKeysOf(state.view.compare.axes.value)).toHaveLength(7);
});

test('the frame and the parts a course page dropped survive with it', () => {
  expect(open('/?embed&hide=risks,editor')).toBe('/?embed=1&hide=editor,risks');
  expect(state.view.embedded.value).toBe(true);
  expect(state.view.hidden.value).toStrictEqual(['editor', 'risks']);
});

test('a page that leaves a page behind does not take its settings with it', () => {
  open('/compare?smiles=CCO&axes=logP');

  expect(open('/method')).toBe('/method');
  expect(open('/about')).toBe('/about');
});

test('a list of property keys tolerates the spacing a human types', () => {
  expect(parseKeys('logP, logS ,,drugScore')).toStrictEqual([
    'logP',
    'logS',
    'drugScore',
  ]);
  expect(parseKeys('')).toStrictEqual([]);
});
