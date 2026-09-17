/**
 * The one global state of the app: `view`, `data`, `preferences`.
 *
 * Components read leaves directly — `state.view.compare.focus.value` — after
 * calling `useSignals()`, and call the actions re-exported here. The state is
 * never passed as a prop.
 */

import { data } from './data.ts';
import { preferences } from './preferences.ts';
import { view } from './view.ts';

/** One state, three first-level buckets. Built once, never reassigned. */
export const state = { view, data, preferences };

export type { LoadStatus, MoleculeRow } from './data.ts';
export {
  advancePrediction,
  clearMolecules,
  failPrediction,
  failReading,
  finishPrediction,
  setMolecules,
  startPrediction,
  startReading,
} from './data.ts';
export {
  MAX_LABEL_LENGTH,
  MAX_MOLECULES,
  MAX_STRUCTURE_LENGTH,
  SHARED_QUERY_LENGTH,
  SHARED_SMILES_LIMIT,
  WARN_MOLECULE_COUNT,
} from './limits.ts';
export { clearStoredBucket, persistBucket } from './persist.ts';
export type { StoredMolecule } from './preferences.ts';
export {
  forgetSet,
  rememberSet,
  setColorScale,
  setShowDuplicates,
} from './preferences.ts';
export {
  BASE_PATH,
  OCL_RESOURCES_PATH,
  SITE_NAME,
  absoluteUrl,
  configuredSiteUrl,
  oclResourcesUrl,
  pathWithoutBase,
  withBase,
} from './site.ts';
export type { TabId } from './tabs.ts';
export {
  DEFAULT_TAB,
  NAV_TAB_IDS,
  TAB_IDS,
  TAB_LABELS,
  isTabId,
} from './tabs.ts';
export {
  loadExplorerStructure,
  openRiskDetail,
  setActiveTab,
  setColorBy,
  setCompareSmiles,
  setDrawnStructure,
  setEmbedded,
  setFocus,
  setHiddenParts,
  setPlotAxes,
} from './view.ts';
