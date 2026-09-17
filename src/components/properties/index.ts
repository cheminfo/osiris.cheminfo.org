/**
 * The property panel: what OSIRIS predicts about one molecule, drawn the same
 * way on both pages.
 *
 * The stylesheets are imported here, so a page that takes the panel — or only a
 * risk square, for a cell of the comparison table — takes the rules that draw
 * it and never carries a copy of them.
 */

import './properties.css';
import './propertyRows.css';

export type { BarGeometry } from './barGeometry.ts';
export { barGeometry } from './barGeometry.ts';
export type { PropertyBarProps } from './PropertyBar.tsx';
export { PropertyBar } from './PropertyBar.tsx';
export type { PropertyPanelProps } from './PropertyPanel.tsx';
export { PropertyPanel } from './PropertyPanel.tsx';
export type { PropertyRowsProps } from './PropertyRows.tsx';
export { PropertyRows } from './PropertyRows.tsx';
export type { RiskAppearance, RiskTone } from './riskAppearance.ts';
export {
  KNOWN_MOLECULE_NOTE,
  PENDING_RISK_LABEL,
  RISK_CAVEAT,
  riskAppearance,
} from './riskAppearance.ts';
export type { RiskFindingsProps } from './RiskFindings.tsx';
export { RiskFindings } from './RiskFindings.tsx';
export type { RiskPanelProps } from './RiskPanel.tsx';
export { RiskPanel } from './RiskPanel.tsx';
export type { RiskSquareProps } from './RiskSquare.tsx';
export { RiskSquare } from './RiskSquare.tsx';
