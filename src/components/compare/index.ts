/**
 * The comparison page's own parts: the two inputs, the figure, the table and
 * the molecule the reader picked.
 *
 * The stylesheet is imported here, so anything taking a part of this page takes
 * the rules that draw it and never carries a copy of them.
 */

import './compare.css';

export type { AxisKey } from './compareAxes.ts';
export {
  AXIS_KEYS,
  DEFAULT_AXIS_KEYS,
  RISK_TICKS,
  axisKeysOf,
  axisLabel,
  axisValue,
  colorValues,
  compareAxes,
  isAxisKey,
} from './compareAxes.ts';
export type { MolfileOf } from './compareDownload.ts';
export {
  SET_COLUMNS,
  downloadName,
  fieldName,
  sdfRecord,
  setRow,
  toSdf,
  toTsv,
} from './compareDownload.ts';
export { lineAlpha } from './compareInk.ts';
export type { ReadProgress } from './compareProgress.ts';
export { readProgress, sharedCount } from './compareProgress.ts';
export type { PublishRows, ReadOutcome, ReadRequest } from './compareReads.ts';
export { addDrawn, readRequest, restoreStored } from './compareReads.ts';
export type { RowStatus } from './compareRows.ts';
export {
  PENDING_TEXT,
  cellText,
  focusIndexOf,
  hideDuplicates,
  keptIndices,
  removeRow,
  rowStatusOf,
} from './compareRows.ts';
export type { SharePlan } from './compareSet.ts';
export { restoreRows, sharePlan, storedOf } from './compareSet.ts';
export { CompareDownload } from './CompareDownload.tsx';
export type { CompareDownloadProps } from './CompareDownload.tsx';
export { CompareEmpty } from './CompareEmpty.tsx';
export { CompareFocus } from './CompareFocus.tsx';
export type { CompareFocusProps } from './CompareFocus.tsx';
export { CompareInputs } from './CompareInputs.tsx';
export type { CompareInputsProps } from './CompareInputs.tsx';
export { ComparePlot } from './ComparePlot.tsx';
export type { ComparePlotProps } from './ComparePlot.tsx';
export { ComparePlotControls } from './ComparePlotControls.tsx';
export type { ComparePlotControlsProps } from './ComparePlotControls.tsx';
export { CompareStatus } from './CompareStatus.tsx';
export type { CompareStatusProps } from './CompareStatus.tsx';
export { CompareTable } from './CompareTable.tsx';
export type { CompareTableProps } from './CompareTable.tsx';
export { CompareTableRow } from './CompareTableRow.tsx';
export type { CompareTableRowProps } from './CompareTableRow.tsx';
export type { CompareSet } from './useCompareSet.ts';
export { useCompareSet } from './useCompareSet.ts';
export type { CompareView } from './useCompareView.ts';
export {
  DEFAULT_COLOR_KEY,
  ROWS_STEP,
  useCompareView,
} from './useCompareView.ts';
