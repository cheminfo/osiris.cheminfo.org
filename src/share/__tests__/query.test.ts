import { parseQueryString } from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import { toSearch } from '../query.ts';

test('a comma is written as a comma, the way every sibling writes one', () => {
  // A link a teacher reads out loud, not one full of `%2C`: the comma is what
  // separates the structures of a set and the keys of `hide`.
  expect(toSearch({ smiles: 'CCO,c1ccccc1' })).toBe('smiles=CCO,c1ccccc1');
  expect(toSearch({ hide: 'plot,table' })).toBe('hide=plot,table');
});

test('what it writes reads back as what it was given, bare flags included', () => {
  const queries: Array<Record<string, string>> = [
    {},
    { smiles: 'CC[N+](C)(C)C' },
    { embed: '', hide: 'plot,table' },
    { smiles: 'CC(=O)Oc1ccccc1C(=O)O', axes: 'logP,logS' },
  ];

  for (const query of queries) {
    expect(parseQueryString(toSearch(query))).toStrictEqual(query);
  }
});
