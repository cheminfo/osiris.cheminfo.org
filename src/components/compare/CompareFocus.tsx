/**
 * The molecule the reader picked, read in full, and the set taken away.
 *
 * The panel is `<PropertyPanel>` — the same component the explorer shows for
 * the molecule on its canvas. One panel for both pages means the ten rows and
 * the four squares cannot come to say different things in different places.
 */

import { Callout, Card } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { PagePart } from 'react-cheminfo/ui';

import { PropertyPanel } from '../properties/index.ts';

import { CompareDownload } from './CompareDownload.tsx';
import { rowStatusOf } from './compareRows.ts';
import type { CompareView } from './useCompareView.ts';

/** What {@link CompareFocus} needs. */
export interface CompareFocusProps {
  /** Everything the page derives from the set. */
  view: CompareView;
  /** What the set was read from, which names a downloaded file. */
  sourceName: string;
  /** Whether the set holds anything at all. */
  empty: boolean;
  /** Called with what went wrong, when writing a file fails. */
  onError: (message: string) => void;
}

/**
 * The right-hand column: the focused molecule, and the download.
 * @param props - See {@link CompareFocusProps}.
 * @returns The panel, the buttons, and the note under them.
 */
export function CompareFocus(props: CompareFocusProps): ReactElement {
  const { view, sourceName, empty, onError } = props;
  const { focusRow, prediction, openRisk, setOpenRisk, keptRows } = view;
  const { results, failures, riskDetail } = prediction;
  const status =
    focusRow === undefined
      ? 'pending'
      : rowStatusOf(focusRow.key, results, failures);

  return (
    <aside className="pane compare-side">
      <Card className="panel">
        <PropertyPanel
          properties={
            focusRow === undefined ? null : (results.get(focusRow.key) ?? null)
          }
          coordinates={focusRow?.coordinates ?? ''}
          pending={focusRow !== undefined && status === 'pending'}
          problem={
            focusRow === undefined ? null : (failures.get(focusRow.key) ?? null)
          }
          emptyMessage="Pick a row, or a line in the plot, to read its properties."
          openRisk={openRisk}
          onOpenRisk={setOpenRisk}
          loadDetail={riskDetail}
        />
      </Card>

      <PagePart part="download">
        <Card className="panel">
          <CompareDownload
            rows={keptRows}
            results={results}
            sourceName={sourceName}
            onError={onError}
          />
        </Card>
      </PagePart>

      {empty ? null : (
        <Callout icon="info-sign">
          These are predictions, not measurements. What each one means, and how
          it was fitted, is on the method page.
        </Callout>
      )}
    </aside>
  );
}
