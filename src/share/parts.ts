/**
 * The regions of a page a shared link can leave out.
 *
 * A link on a course page is rarely the whole site: it is one molecule and its
 * risks, without the chrome, and often without the controls a student would use
 * to change what it shows. `?embed` drops the header, its bar and the footer;
 * `?hide=` names what else to drop, and the share dialog only offers what the
 * open page has.
 *
 * The parts are described in the family's own vocabulary, so `?hide=` is read
 * and written by `react-cheminfo` rather than by a second implementation here.
 */

import type { HideablePart } from 'react-cheminfo/core';

import type { TabId } from '../state/tabs.ts';

export { EMBED_PARAM, HIDE_PARAM } from 'react-cheminfo/core';

/** Every hideable region, in the order a link and the dialog list them. */
export const SHARE_PART_IDS = [
  'editor',
  'smilesInput',
  'fileInput',
  'table',
  'plot',
  'properties',
  'risks',
  'detail',
  'download',
] as const;

/** One of {@link SHARE_PART_IDS}. */
export type SharePartId = (typeof SHARE_PART_IDS)[number];

/** The label and the one-line explanation the dialog shows for each part. */
export const SHARE_PARTS: Record<SharePartId, HideablePart> = {
  editor: {
    key: 'editor',
    label: 'Structure editor',
    description:
      'The drawing surface, so the molecule the link names is fixed.',
  },
  smilesInput: {
    key: 'smilesInput',
    label: 'SMILES box',
    description: 'The box a list is pasted into, leaving the set as it is.',
  },
  fileInput: {
    key: 'fileInput',
    label: 'File import',
    description: 'The file picker, and reading a file dropped on the box.',
    hiddenByDefault: true,
  },
  table: {
    key: 'table',
    label: 'Comparison table',
    description: 'The row-per-molecule table under the plot.',
  },
  plot: {
    key: 'plot',
    label: 'Parallel coordinates',
    description: 'The plot, leaving the table to be read on its own.',
  },
  properties: {
    key: 'properties',
    label: 'Predicted properties',
    description: 'The cLogP to drug-score panel, leaving the risks alone.',
  },
  risks: {
    key: 'risks',
    label: 'Predicted risks',
    description: 'The four toxicity squares, leaving the properties alone.',
  },
  detail: {
    key: 'detail',
    label: 'Risk detail',
    description: 'The fragment a risk was raised on, drawn beside it.',
  },
  download: {
    key: 'download',
    label: 'Download',
    description: 'The buttons writing the set out as TSV or SDF.',
    hiddenByDefault: true,
  },
};

/**
 * What each page offers to hide. The header and the footer are not parts:
 * `?embed` drops them, and the page bar with them.
 */
export const TAB_PARTS: Record<TabId, readonly SharePartId[]> = {
  explorer: ['editor', 'properties', 'risks', 'detail'],
  compare: [
    'editor',
    'smilesInput',
    'fileInput',
    'table',
    'plot',
    'properties',
    'risks',
    'detail',
    'download',
  ],
  method: [],
  about: [],
};

/**
 * The parts a page can leave out.
 * @param tab - Page the link points at.
 * @returns Its part identifiers, in {@link SHARE_PART_IDS} order.
 */
export function partsOf(tab: TabId): readonly SharePartId[] {
  return TAB_PARTS[tab];
}
