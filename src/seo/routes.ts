/**
 * Every address the site answers, with the name and the sentence it is indexed
 * under.
 *
 * One table, read by three things: the build, which writes an HTML file per
 * entry and the sitemap listing them; the head injector; and the running app,
 * which retitles the tab after an in-app move. A page missing from here is a
 * page a search engine only ever sees as the home page.
 *
 * The machinery that reads it is `react-cheminfo/core` and
 * `react-cheminfo/vite`; what belongs to this site is the prose below.
 */

import type { RouteMeta } from 'react-cheminfo/core';

/**
 * The pages that exist whatever the data says: the two workbenches, the page
 * describing how the predictions are made, and the About.
 *
 * They are also the crawl path, so each carries the label it is known by and a
 * note saying what it is for.
 */
export const FIXED_ROUTES: readonly RouteMeta[] = [
  {
    path: '/',
    title: 'Predicted risks and properties of a molecule',
    description:
      'Draw a structure and read its predicted mutagenic, tumorigenic, irritant and reproductive risks beside cLogP, solubility, TPSA and drug score.',
    short: 'Explorer',
    note: 'one structure, every predicted value',
  },
  {
    path: '/compare',
    title: 'Compare a set of molecules on their properties',
    description:
      'Load an SDF file, a list of SMILES or a pasted set, and compare every molecule in a table and a parallel-coordinates plot you can brush.',
    short: 'Compare',
    note: 'a whole set, in a table and a plot',
  },
  {
    path: '/method',
    title: 'How the predictions are made',
    description:
      'Where the toxicity risks, cLogP, solubility, drug-likeness and drug score come from, how their fragment lists were built, and how far each was checked.',
    short: 'Method',
    note: 'where each number comes from',
  },
  {
    path: '/about',
    title: 'About — what this tool predicts and what it borrows',
    description:
      'What these predictions are, how far they can be trusted, the libraries the tool borrows, how to cite it, and where to report a problem.',
    short: 'About',
    note: 'what it predicts, and what it borrows',
  },
];

/**
 * The addresses composed from the site's own data. Empty: a molecule is
 * something a visitor brings, not a page this site publishes, so what the tool
 * is working on lives in the query rather than in a path of its own.
 *
 * It is a separate table so appending one never touches the prose above.
 */
export const GENERATED_ROUTES: readonly RouteMeta[] = [];

/** Every routed address: the fixed pages, then everything composed from data. */
export const PAGE_ROUTES: readonly RouteMeta[] = [
  ...FIXED_ROUTES,
  ...GENERATED_ROUTES,
];

/**
 * The pages the crawl path lists, for a visitor or a crawler with no
 * JavaScript.
 */
export const NOSCRIPT_ROUTES: readonly RouteMeta[] = FIXED_ROUTES;
