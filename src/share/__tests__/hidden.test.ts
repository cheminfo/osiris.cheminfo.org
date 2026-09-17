import { expect, test } from 'vitest';

import { isSharePartId, parseHidden, serializeHidden } from '../hidden.ts';
import { SHARE_PARTS, SHARE_PART_IDS } from '../parts.ts';

test('an absent parameter hides nothing', () => {
  expect(parseHidden(undefined)).toStrictEqual([]);
  expect(parseHidden('')).toStrictEqual([]);
  expect(serializeHidden([])).toBe('');
});

test('a name the site does not know is dropped, not kept', () => {
  expect(parseHidden('risks,sidebar,plot')).toStrictEqual(['plot', 'risks']);
  expect(parseHidden('header')).toStrictEqual([]);
  expect(isSharePartId('risks')).toBe(true);
  expect(isSharePartId('sidebar')).toBe(false);
});

test('the parameter is written in one canonical order', () => {
  expect(parseHidden('download, risks ,editor')).toStrictEqual([
    'editor',
    'risks',
    'download',
  ]);
  expect(serializeHidden(['download', 'editor', 'risks'])).toBe(
    'editor,risks,download',
  );
});

test('parse and serialize are each other, over every part at once', () => {
  const all = serializeHidden(SHARE_PART_IDS);

  expect(all).toBe(SHARE_PART_IDS.join(','));
  expect(parseHidden(all)).toStrictEqual([...SHARE_PART_IDS]);
});

test('every part describes itself for the dialog', () => {
  expect(SHARE_PART_IDS).toStrictEqual([
    'editor',
    'smilesInput',
    'fileInput',
    'table',
    'plot',
    'properties',
    'risks',
    'detail',
    'download',
  ]);
  for (const id of SHARE_PART_IDS) {
    const part = SHARE_PARTS[id];
    expect(part.key).toBe(id);
    expect(part.label.length).toBeGreaterThan(2);
    expect(part.description.length).toBeLessThanOrEqual(80);
  }
});

test('an embedded link opens with what a host page has no use for switched off', () => {
  expect(
    SHARE_PART_IDS.filter((id) => SHARE_PARTS[id].hiddenByDefault === true),
  ).toStrictEqual(['fileInput', 'download']);
});
