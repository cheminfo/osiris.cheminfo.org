/**
 * What each address says in the HTML the server hands out, above the crawl path.
 *
 * All 4 addresses used to ship the same body — this site's menu — so a crawler
 * was handed one text for every page and told, by the title alone, that they
 * were different pages. Read by the build and by nothing else: `vite.config.ts`
 * calls it once per route, so none of this reaches the bundle a browser
 * downloads.
 *
 * A page with nothing written for it falls back to the name and the sentence it
 * is already indexed under. That repeats the snippet rather than adding to it,
 * which is thin — but the route table writes those distinctly per page, so a
 * thin page is never a duplicate of its neighbour.
 */

import type { PageContent, RouteMeta } from 'react-cheminfo/core';

/** The pages written for in their own words. */
const PAGES: Record<string, PageContent> = {
  '/': {
    heading: 'Predicted risks and properties of a molecule',
    paragraphs: [
      'Draw a structure and read its predicted mutagenic, tumorigenic, irritant and reproductive risks beside cLogP, solubility, polar surface area and a drug score. Every prediction is made in the page.',
      'These are fragment-based predictions, not measurements: a risk flag means the structure contains a fragment found in compounds that showed it, which is a reason to look rather than a result.',
    ],
  },
};

/**
 * What one address says for itself.
 *
 * Read by `cheminfoPrerender` once per route at build time.
 * @param route - The address being written.
 * @returns Its text, authored where there is any and otherwise the name and
 * sentence the route already carries.
 */
export function pageContent(route: RouteMeta): PageContent {
  return (
    PAGES[route.path] ?? {
      heading: route.title,
      paragraphs: [route.description],
    }
  );
}
