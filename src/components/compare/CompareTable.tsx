/**
 * The set, one molecule per row.
 *
 * It shows only the rows the brushes kept, and only as many of those as the
 * reader has asked for: two thousand structure drawings mounted at once is a
 * frozen tab, and the rows on screen are also the ones whose predictions the
 * pool is told to work out first.
 *
 * Hovering a row lights its line in the plot and hovering a line lights its
 * row, because the two are one view of one set.
 */

import { Button, NonIdealState } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { formatInteger } from 'react-cheminfo/core';
import { useListKeyboardNavigation } from 'react-cheminfo/ui';

import type { OsirisProperties } from '../../osiris/index.ts';
import {
  PROPERTY_KEYS,
  RISK_LABELS,
  RISK_TYPES,
  propertyScale,
} from '../../osiris/index.ts';
import type { MoleculeRow } from '../../state/index.ts';

import { CompareTableRow } from './CompareTableRow.tsx';
import { rowStatusOf } from './compareRows.ts';

/** The short headers the four risk columns take, since their names are long. */
const RISK_HEADS: Record<string, string> = {
  mutagenic: 'Mut.',
  tumorigenic: 'Tum.',
  irritant: 'Irr.',
  reproductive: 'Repr.',
};

/** What {@link CompareTable} needs. */
export interface CompareTableProps {
  /** The whole set, in the figure's row order. */
  rows: readonly MoleculeRow[];
  /** The rows to show, as indices into the set. */
  indices: readonly number[];
  /** How many rows the brushes kept in all. */
  kept: number;
  /** What has been predicted, by row key. */
  results: ReadonlyMap<string, OsirisProperties>;
  /** Why each refused row was refused, by row key. */
  failures: ReadonlyMap<string, string>;
  /** The focused row, or `-1`. */
  selected: number;
  /** The row under the pointer, or `-1`. */
  hovered: number;
  /** Called with a row's index when it is picked, or `-1` to focus none. */
  onSelect: (index: number) => void;
  /** Called with a row's index when the pointer enters or leaves it. */
  onHover: (index: number) => void;
  /** Called with a row's key when it is to be taken out of the set. */
  onRemove: (key: string) => void;
  /** Called when the reader asks for more rows than are shown. */
  onShowMore: () => void;
  /** What stands in the table's place when the set is empty. */
  empty: ReactElement;
}

/**
 * The comparison table.
 * @param props - See {@link CompareTableProps}.
 * @returns The table, or what stands in its place.
 */
export function CompareTable(props: CompareTableProps): ReactElement {
  const { rows, indices, kept, results, failures, selected, hovered } = props;
  const { onSelect, onHover, onRemove, onShowMore, empty } = props;
  const handleKey = useListKeyboardNavigation({
    length: indices.length,
    selectedIndex: indices.indexOf(selected),
    onSelect: (next) => {
      onSelect(indices[next] ?? -1);
    },
  });

  if (rows.length === 0) return empty;
  if (indices.length === 0) {
    return (
      <NonIdealState
        icon="filter"
        description="No molecule is inside every brushed interval. Clear a brush to see the set again."
      />
    );
  }

  return (
    <>
      {/* The scroller holds the focus, so ArrowUp and ArrowDown move the
          selection without the reader having to click a row first. */}
      <div
        className="compare-scroller"
        role="region"
        aria-label="The comparison set"
        tabIndex={0}
        onKeyDown={handleKey}
      >
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">Structure</th>
              {PROPERTY_KEYS.map((key) => (
                <th key={key} scope="col" className="compare-cell__number">
                  {propertyScale(key).label}
                </th>
              ))}
              {RISK_TYPES.map((risk) => (
                <th
                  key={risk}
                  scope="col"
                  className="compare-cell__risk"
                  title={RISK_LABELS[risk]}
                >
                  {RISK_HEADS[risk] ?? RISK_LABELS[risk]}
                </th>
              ))}
              <th scope="col">
                <span className="visually-hidden">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {indices.map((index) => {
              const row = rows[index];
              if (row === undefined) return null;
              return (
                <CompareTableRow
                  key={row.key}
                  row={row}
                  index={index}
                  properties={results.get(row.key)}
                  status={rowStatusOf(row.key, results, failures)}
                  problem={failures.get(row.key) ?? null}
                  selected={index === selected}
                  hovered={index === hovered}
                  onSelect={onSelect}
                  onHover={onHover}
                  onRemove={onRemove}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      {indices.length < kept ? (
        <Button
          icon="chevron-down"
          text={`Show more — ${formatInteger(indices.length)} of ${formatInteger(kept)} shown`}
          onClick={onShowMore}
        />
      ) : null}
    </>
  );
}
