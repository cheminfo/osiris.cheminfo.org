/**
 * OpenChemLib, loaded once and proved to be working before anything is
 * predicted with it.
 *
 * Both predictors throw `static resources must be registered first` until
 * `Resources.register*` has run — but only when *nothing* was registered. If
 * something else was, `new ToxicityPredictor()` constructs happily, prints to
 * the console, and answers every `assessRisk` with `RISK_UNKNOWN`, on which
 * `DrugScoreCalculator` applies no penalty at all. The failure therefore reads
 * on screen as four clean molecules and a healthy score. So the tables are
 * proved here, at start-up, against a molecule whose answer is known: a
 * fragment match that must come back high, and a drug-likeness that must be a
 * real number. Between them the two families of resource file are both covered.
 *
 * The check costs about 160 ms once per worker, most of which is warm-up the
 * first real molecule would have paid anyway — measured, a first prediction is
 * 320 ms cold against 191 ms warm.
 */

import type * as OCL from 'openchemlib';

import {
  NO_FRAGMENT_MATCHED,
  RISK_TYPE_CODES,
  UNKNOWN_NUMBER,
} from './constants.ts';

/**
 * Where the resource tables come from: the URL of the site's own
 * `openchemlib-resources.json`, or the parsed file itself.
 *
 * A URL must be absolute. `registerFromUrl` resolves a relative one against
 * `import.meta.url`, which after a build is a hashed chunk under `assets/`, so
 * it answers 404 and every prediction quietly becomes unknown.
 */
export type ResourceSource = string | Readonly<Record<string, string>>;

/** OpenChemLib, registered, checked and ready to predict with. */
export interface OsirisPredictors {
  /** Reads an idCode or a SMILES into a molecule. */
  Molecule: typeof OCL.Molecule;
  /** cLogP, solubility, TPSA and the four counts. */
  MoleculeProperties: typeof OCL.MoleculeProperties;
  /** Finds a toxicophore on a molecule, in the predictor's own match mode. */
  SSSearcher: typeof OCL.SSSearcher;
  /** The four spline terms and the four risk factors. */
  DrugScoreCalculator: typeof OCL.DrugScoreCalculator;
  /** The four risk assessments and their explanations. */
  toxicity: OCL.ToxicityPredictor;
  /** The 5294-fragment drug-likeness table. */
  druglikeness: OCL.DruglikenessPredictor;
}

/** The tables did not load, so nothing may be predicted. */
export class PredictorsUnavailableError extends Error {
  override name = 'PredictorsUnavailableError';
}

/**
 * OpenChemLib with its resources registered and checked.
 *
 * Loaded lazily — the library is 340 kB gzipped and does not tree-shake — and
 * kept, because `Resources.register` replaces the whole map rather than merging
 * into it, so registering twice with different keys silently unregisters the
 * first set.
 * @param source - The resources URL, or the parsed resources themselves.
 * @returns The predictors, proved to answer.
 * @throws {PredictorsUnavailableError} When the resources did not load, or loaded and answer nothing.
 */
export function loadPredictors(
  source: ResourceSource,
): Promise<OsirisPredictors> {
  if (loaded === null) loaded = start(source);
  return loaded;
}

/** Forget the loaded predictors, so the next call registers again. */
export function resetPredictors(): void {
  loaded = null;
}

let loaded: Promise<OsirisPredictors> | null = null;

/**
 * A failed load is not kept: a fetch that failed once may well answer on the
 * next try, and a cached rejection would turn one lost packet into a page that
 * stays broken until it is reloaded.
 */
function start(source: ResourceSource): Promise<OsirisPredictors> {
  const pending = build(source);
  void pending.catch(() => {
    if (loaded === pending) loaded = null;
  });
  return pending;
}

/** Benzidine — its mutagenicity comes from a fragment match, not from a list. */
const PROBE_ID_CODE = 'dg}@@@mIe]e^ftx@H@H@@';

const UNAVAILABLE =
  'The prediction tables did not load, so no risk or drug-likeness can be computed. Reload the page.';

async function build(source: ResourceSource): Promise<OsirisPredictors> {
  const ocl = await import('openchemlib');
  try {
    if (typeof source === 'string') await ocl.Resources.registerFromUrl(source);
    else ocl.Resources.register({ ...source });
  } catch {
    throw new PredictorsUnavailableError(UNAVAILABLE);
  }

  let toxicity: OCL.ToxicityPredictor;
  let druglikeness: OCL.DruglikenessPredictor;
  try {
    toxicity = new ocl.ToxicityPredictor();
    druglikeness = new ocl.DruglikenessPredictor();
  } catch {
    throw new PredictorsUnavailableError(UNAVAILABLE);
  }

  const probe = ocl.Molecule.fromIDCode(PROBE_ID_CODE);
  const risk = toxicity.assessRisk(probe, RISK_TYPE_CODES.mutagenic);
  const likeness = druglikeness.assessDruglikeness(probe);
  if (
    risk !== 3 ||
    likeness === UNKNOWN_NUMBER ||
    likeness === NO_FRAGMENT_MATCHED
  ) {
    throw new PredictorsUnavailableError(UNAVAILABLE);
  }

  return {
    Molecule: ocl.Molecule,
    MoleculeProperties: ocl.MoleculeProperties,
    SSSearcher: ocl.SSSearcher,
    DrugScoreCalculator: ocl.DrugScoreCalculator,
    toxicity,
    druglikeness,
  };
}
