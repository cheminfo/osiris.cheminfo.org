/**
 * The nine figures of the method document: where each one is served from, what
 * it shows, and how big it is.
 *
 * The Markdown names them the way its author wrote them — `src="toxicity.gif"`,
 * beside the page they were published on. Nothing here rewrites those nine
 * attributes in the source; the renderer asks this module for each one instead,
 * so the address a figure is fetched from is decided in a single place and
 * carries the mount path this deployment answers under. A `src` written from
 * the site's root would resolve against the host rather than the site, and
 * every figure would 404 the day the tool is served as one of several on a
 * shared host — which is exactly the deployment `withBase()` exists for.
 *
 * The alt text is ours: the source writes none, and a figure a screen reader
 * cannot name is a figure it skips. Each opens with the heading it sits under.
 *
 * The intrinsic sizes are the files' own, so a figure reserves its room before
 * it has loaded and the paragraph under it does not jump as the page fills.
 */

import { withBase } from '../state/site.ts';

/** One figure of the method document, as the Markdown refers to it. */
export interface MethodFigure {
  /** The file name the Markdown writes in its `src`. */
  file: string;
  /** What the figure shows, opening with the heading it sits under. */
  alt: string;
  /** The file's own width, in pixels. */
  width: number;
  /** The file's own height, in pixels. */
  height: number;
}

/** A figure resolved for this deployment, ready to render. */
export interface ResolvedMethodFigure extends MethodFigure {
  /** Where the browser fetches it from, mount path included. */
  url: string;
}

/**
 * Where the figures are served from, under the site's own root. `public/method`
 * at build time, `method/` under whatever this deployment is mounted at.
 */
export const METHOD_FIGURE_DIRECTORY = 'method/';

/** Every figure the method document shows, in the order it shows them. */
export const METHOD_FIGURES: readonly MethodFigure[] = [
  {
    file: 'toxicity.gif',
    alt: 'Toxicity risk assessment: predicted risk over four RTECS subsets, beside a control set of traded drugs.',
    width: 522,
    height: 454,
  },
  {
    file: 'logP_1.gif',
    alt: 'cLogP calculation: calculated logP over more than 3000 drugs on the market.',
    width: 272,
    height: 208,
  },
  {
    file: 'logP_2.gif',
    alt: 'cLogP calculation: calculated against experimental logP, over an independent test set.',
    width: 318,
    height: 260,
  },
  {
    file: 'logS_1.gif',
    alt: 'logS calculation: estimated logS over the drugs on the market.',
    width: 221,
    height: 208,
  },
  {
    file: 'logS_2.gif',
    alt: 'logS calculation: calculated against experimentally determined logS.',
    width: 318,
    height: 260,
  },
  {
    file: 'mw.gif',
    alt: 'Molecular weight: the molecular weights of the drugs on the market.',
    width: 271,
    height: 208,
  },
  {
    file: 'likeness_1.gif',
    alt: 'Fragment based druglikeness: the equation summing the scores of the fragments present.',
    width: 80,
    height: 59,
  },
  {
    file: 'likeness_2.gif',
    alt: 'Fragment based druglikeness: 15000 Fluka compounds against 3300 traded drugs.',
    width: 351,
    height: 290,
  },
  {
    file: 'score.gif',
    alt: 'Drug score: the two equations it is calculated with.',
    width: 222,
    height: 142,
  },
];

/**
 * The figure a `src` in the method document names, ready for this deployment.
 *
 * Only the nine figures shipped with the text resolve. Anything else — an
 * absolute address, a file nobody copied into `public/method` — comes back
 * `null` and is not rendered, so the page never asks the reader's browser for
 * something this site does not serve. A figure added to the Markdown without an
 * entry here fails the test that reads both.
 * @param src - The `src` attribute as the Markdown wrote it.
 * @returns The figure, or `null` when the document does not ship one by that name.
 */
export function resolveMethodFigure(
  src: string | undefined,
): ResolvedMethodFigure | null {
  if (src === undefined) return null;
  for (const figure of METHOD_FIGURES) {
    if (figure.file === src) {
      return {
        ...figure,
        url: withBase(`${METHOD_FIGURE_DIRECTORY}${figure.file}`),
      };
    }
  }
  return null;
}
