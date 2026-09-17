/**
 * What this site says about itself, as the record the shared About page draws.
 *
 * Content only: the page, its sections and their order belong to
 * `react-cheminfo`, so a reader who has seen one About of the family knows
 * where the credits are on this one.
 */

import { BUILD_INFO } from 'react-cheminfo/build-info';
import type { AboutContent, CitedWork, Reference } from 'react-cheminfo/core';
import { OPENCHEMLIB_WORK } from 'react-cheminfo/core';

/**
 * The paper describing the system these predictions were first published in.
 * It is declared here rather than in `react-cheminfo` because it describes the
 * OSIRIS informatics system, not the toolkit the library wraps.
 */
const OSIRIS_PAPER: Reference = {
  authors: [
    { given: 'T.', family: 'Sander' },
    { given: 'J.', family: 'Freyss' },
    { given: 'M.', family: 'von Korff' },
    { given: 'J. R.', family: 'Reich' },
    { given: 'C.', family: 'Rufener' },
  ],
  title:
    'OSIRIS, an Entirely in-House Developed Drug Discovery Informatics System',
  journal: 'Journal of Chemical Information and Modeling',
  journalAbbreviation: 'J. Chem. Inf. Model.',
  year: 2009,
  volume: '49',
  issue: '2',
  firstPage: '232',
  lastPage: '246',
  doi: '10.1021/ci800305f',
  publisher: 'American Chemical Society',
};

/** OSIRIS itself, for the predictions this tool puts back in a browser. */
const OSIRIS_WORK: CitedWork = {
  reference: OSIRIS_PAPER,
  what: 'The OSIRIS property predictions',
  note: 'Cite it for the risk and property models every number here comes from.',
};

/** The record `/about` renders. */
export const ABOUT: AboutContent = {
  siteId: 'osiris',
  // Which release, built when, from which commit: the build says so,
  // because a version written by hand is wrong by the next release.
  build: BUILD_INFO,
  what: 'Draw a molecule and read its predicted toxicity risks, physicochemical properties and drug score.',
  can: [
    'Draw one structure and read its four toxicity risks at once.',
    'Read cLogP, logS, TPSA, molweight and the drug score as you draw.',
    'Load an SDF file, a SMILES list or pasted SMILES and compare them in a table.',
    'Plot every property of a set on parallel coordinates and brush the ranges.',
    'Sort, filter and export the table as TSV.',
  ],
  paragraphs: [
    'The predictions come from OpenChemLib, which carries the property and toxicity models of the original OSIRIS Property Explorer: each risk is a substructure match against a set of fragments derived from the RTECS registry, and cLogP, logS and drug-likeness are fitted from fragment contributions.',
    'A prediction is a warning, not a verdict. A fragment flagged as mutagenic is a reason to look, and a clean molecule is not a safe one. Everything runs in the page, so nothing you draw or load is sent anywhere.',
  ],
  people: [{ name: 'Luc Patiny' }],
  providedBy: ['epfl'],
  credits: [
    'openchemlib',
    'osiris-property-explorer',
    'react-ocl',
    'react-mf',
    'blueprint',
    'react-science',
    'react-cheminfo',
    'react',
    'vite',
  ],
  cite: [OSIRIS_WORK, OPENCHEMLIB_WORK],
};
