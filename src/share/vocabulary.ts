/**
 * What a link to one page of this site can say: the parts it can switch off,
 * and nothing else.
 */

import type { ShareVocabulary } from 'react-cheminfo/core';

import type { TabId } from '../state/tabs.ts';

import { SHARE_PARTS, partsOf } from './parts.ts';

/**
 * The vocabulary the share dialog offers on a page.
 *
 * Only the parts that page actually has, in the canonical order of `?hide=`, so
 * one selection always produces one link.
 *
 * The tool's own inputs — the molecule, the set, the axes, the colour, the
 * focused row — are deliberately not listed. They belong to the address, not to
 * the dialog: a key this vocabulary does not name is carried through untouched,
 * and the dialog then opens on the link a course page would want rather than
 * concluding that any page holding a molecule is already configured.
 * @param tab - Page the link points at.
 * @returns What its links can say.
 */
export function shareVocabularyOf(tab: TabId): ShareVocabulary {
  return { parts: partsOf(tab).map((id) => SHARE_PARTS[id]) };
}
