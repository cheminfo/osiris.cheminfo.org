import {
  applyShareConfig,
  isShareConfigured,
  parseShareConfig,
  suggestedShareConfig,
} from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import { shareVocabularyOf } from '../vocabulary.ts';

/** The address of a page with a set on it, which is a page worth sharing. */
const LOADED = 'smiles=CCO,c1ccccc1&axes=logP,logS&color=drugScore';

test('the dialog offers the parts of the page it is opened on', () => {
  expect(shareVocabularyOf('compare').parts.map((part) => part.key)).toContain(
    'download',
  );
  expect(shareVocabularyOf('about').parts).toStrictEqual([]);
});

test('a page carrying a molecule is not a page already configured', () => {
  const vocabulary = shareVocabularyOf('compare');

  // The set, the axes and the colour are the tool's own inputs, not something
  // the dialog configures — so the dialog opens on the link to hand out.
  expect(
    isShareConfigured(parseShareConfig(LOADED, vocabulary), vocabulary),
  ).toBe(false);
  expect(
    isShareConfigured(parseShareConfig('embed=1', vocabulary), vocabulary),
  ).toBe(true);
  expect(
    isShareConfigured(
      parseShareConfig('hide=download', vocabulary),
      vocabulary,
    ),
  ).toBe(true);
});

test('what the dialog writes leaves the tool inputs exactly as it found them', () => {
  const vocabulary = shareVocabularyOf('compare');
  const written = applyShareConfig(
    LOADED,
    suggestedShareConfig(vocabulary),
    vocabulary,
  );

  expect(written).toBe(
    'smiles=CCO,c1ccccc1&axes=logP,logS&color=drugScore&embed=1&hide=fileInput,download',
  );
});
