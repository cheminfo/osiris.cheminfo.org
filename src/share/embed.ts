/**
 * Whether a link asks for the page without its chrome.
 *
 * `?embed` is the one switch for the header, its page bar and the footer, and
 * `react-cheminfo` reads it: `?embed`, `?embed=1` and anything but `?embed=0`
 * frame the page, because a teacher retypes these by hand. Links written for
 * the legacy visualizer view said `?hide=header` instead; they still open
 * framed.
 */

import type { ShareVocabulary } from 'react-cheminfo/core';
import { isHidden, parseShareConfig } from 'react-cheminfo/core';

import { toSearch } from './query.ts';

export { EMBED_PARAM } from 'react-cheminfo/core';

/** The part name older links dropped the chrome with. */
const LEGACY_HEADER_PART = 'header';

/** Only what a link can say about the chrome, old form included. */
const CHROME_VOCABULARY: ShareVocabulary = {
  parts: [
    {
      key: LEGACY_HEADER_PART,
      label: 'Site header',
      description: 'The chrome, as links written before `embed` dropped it.',
    },
  ],
};

/**
 * Read the embed switch out of a decoded query.
 * @param query - Decoded query of the address.
 * @returns True when the page must render without header, bar and footer.
 */
export function parseEmbed(query: Readonly<Record<string, string>>): boolean {
  const config = parseShareConfig(toSearch(query), CHROME_VOCABULARY);
  return config.embed || isHidden(config, LEGACY_HEADER_PART);
}
