/**
 * One molecule of the comparison table: what it looks like, its ten numbers
 * and its four risks.
 *
 * Memoised on purpose. A set of two thousand is answered one molecule at a
 * time, so the page re-renders once per answer; without this every visible row
 * would redraw its structure each time, and a structure drawing is the most
 * expensive thing on the page. What changes for a row is its `properties`, and
 * that changes exactly once.
 */

import { Button } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { memo } from 'react';
import { Structure } from 'react-cheminfo/structure';

import type { OsirisProperties } from '../../osiris/index.ts';
import { PROPERTY_KEYS, RISK_TYPES } from '../../osiris/index.ts';
import type { MoleculeRow } from '../../state/index.ts';
import { RiskSquare } from '../properties/index.ts';

import type { RowStatus } from './compareRows.ts';
import { cellText } from './compareRows.ts';

/** How large a row's structure is drawn, in pixels. */
const DRAWING = { width: 96, height: 60 };

/** What {@link CompareTableRow} needs. */
export interface CompareTableRowProps {
  /** The molecule. */
  row: MoleculeRow;
  /** Its position in the set, which is how the plot names it. */
  index: number;
  /** What was predicted for it, or `undefined` while its worker is running. */
  properties: OsirisProperties | undefined;
  /** Where it is: waiting, answered, or refused. */
  status: RowStatus;
  /** Why it was refused, or `null`. */
  problem: string | null;
  /** Whether it is the focused row. */
  selected: boolean;
  /** Whether the pointer is on it, here or on its line in the plot. */
  hovered: boolean;
  /** Called with the row's index when it is picked. */
  onSelect: (index: number) => void;
  /** Called with the row's index when the pointer enters or leaves it. */
  onHover: (index: number) => void;
  /** Called with the row's key when it is to be taken out of the set. */
  onRemove: (key: string) => void;
}

/**
 * One row of the comparison table.
 * @param props - See {@link CompareTableRowProps}.
 * @returns The row.
 */
export const CompareTableRow = memo(function CompareTableRow(
  props: CompareTableRowProps,
): ReactElement {
  const { row, index, properties, status, problem } = props;
  const { selected, hovered, onSelect, onHover, onRemove } = props;

  return (
    <tr
      className="compare-row"
      data-selected={selected}
      data-hovered={hovered}
      onMouseEnter={() => {
        onHover(index);
      }}
      onMouseLeave={() => {
        onHover(-1);
      }}
      onClick={() => {
        onSelect(index);
      }}
    >
      <td className="compare-cell__structure" title={row.label}>
        <Structure
          idCode={row.idCode}
          coordinates={row.coordinates}
          width={DRAWING.width}
          height={DRAWING.height}
        />
        <span className="compare-name">{row.label}</span>
        {row.duplicateOf === null ? null : (
          <span className="compare-repeat" title="Already in the set above">
            repeat
          </span>
        )}
        {problem === null ? null : (
          <span className="compare-problem">{problem}</span>
        )}
      </td>
      {PROPERTY_KEYS.map((key) => (
        <td key={key} className="compare-cell__number">
          {cellText(properties, key, status)}
        </td>
      ))}
      {RISK_TYPES.map((risk) => (
        <td key={risk} className="compare-cell__risk">
          <RiskSquare
            risk={risk}
            level={
              properties === undefined ? undefined : properties.risks[risk]
            }
            compact
          />
        </td>
      ))}
      <td className="compare-cell__remove">
        <Button
          variant="minimal"
          icon="cross"
          title={`Remove ${row.label}`}
          aria-label={`Remove ${row.label}`}
          onClick={(event) => {
            event.stopPropagation();
            onRemove(row.key);
          }}
        />
      </td>
    </tr>
  );
});
