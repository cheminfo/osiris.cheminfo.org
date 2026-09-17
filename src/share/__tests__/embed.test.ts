import { expect, test } from 'vitest';

import { parseEmbed } from '../embed.ts';

test('a page with no embed parameter keeps its chrome', () => {
  expect(parseEmbed({})).toBe(false);
  expect(parseEmbed({ hide: 'plot' })).toBe(false);
});

test('a teacher may write the switch by hand, in any of its forms', () => {
  expect(parseEmbed({ embed: '' })).toBe(true);
  expect(parseEmbed({ embed: '1' })).toBe(true);
  expect(parseEmbed({ embed: 'yes' })).toBe(true);
  expect(parseEmbed({ embed: '0' })).toBe(false);
});

test('a link written for the old view still opens framed', () => {
  expect(parseEmbed({ hide: 'header' })).toBe(true);
  expect(parseEmbed({ hide: 'editor,header,download' })).toBe(true);
});
