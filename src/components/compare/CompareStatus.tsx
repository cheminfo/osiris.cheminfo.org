/**
 * What the page says about a set while it is being read and predicted.
 *
 * A prediction costs a fifth of a second and a set can hold two thousand
 * molecules, so the honest thing is to say where the run is and to let it be
 * stopped. Everything else here is what a reader has to be told rather than
 * left to discover: an entry that would not read, a set cut at the cap, and a
 * link that could not carry the whole set.
 */

import { Button, Callout } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { formatInteger } from 'react-cheminfo/core';

import type { PredictionProgress } from '../../osiris/index.ts';
import { WARN_MOLECULE_COUNT } from '../../state/index.ts';

import type { CompareSet } from './useCompareSet.ts';

/** The most problem lines shown before the rest are counted instead. */
const SHOWN_PROBLEMS = 8;

/** What {@link CompareStatus} needs. */
export interface CompareStatusProps {
  /** The set being read. */
  set: CompareSet;
  /** How far the prediction pool has got. */
  progress: PredictionProgress;
  /** Why nothing can be predicted at all, or `null`. */
  error: string | null;
  /** Drop everything still queued. */
  onCancel: () => void;
}

/**
 * The lines above the plot: what is running, and what went wrong.
 * @param props - See {@link CompareStatusProps}.
 * @returns The callouts that apply, and nothing when none does.
 */
export function CompareStatus(props: CompareStatusProps): ReactElement | null {
  const { set, progress, error, onCancel } = props;
  const lines: ReactElement[] = [];

  if (error !== null) {
    lines.push(
      <Callout key="error" intent="danger" icon="error">
        {error}
      </Callout>,
    );
  }
  if (set.error !== null) {
    lines.push(
      <Callout key="read" intent="danger" icon="error">
        {set.error}
      </Callout>,
    );
  }
  if (set.reading !== null) {
    lines.push(
      <Callout key="reading" intent="primary" icon="import">
        {set.reading.total === 0
          ? 'Reading…'
          : `Reading ${formatInteger(set.reading.done)} of ${formatInteger(set.reading.total)} structures…`}
      </Callout>,
    );
  }
  if (progress.running) {
    lines.push(
      <Callout key="predicting" intent="primary" icon="time">
        <span className="compare-progress">
          <span>
            {formatInteger(progress.done)} of {formatInteger(progress.total)}{' '}
            molecules predicted
          </span>
          <Button variant="minimal" text="Cancel" onClick={onCancel} />
        </span>
      </Callout>,
    );
  }
  if (set.rows.length > WARN_MOLECULE_COUNT && progress.running) {
    lines.push(
      <Callout key="size" intent="warning" icon="warning-sign">
        A molecule takes about a third of a second on one core, so a set this
        size fills in over several minutes. Every row is usable as it arrives.
      </Callout>,
    );
  }
  if (set.rows.length > set.shared) {
    lines.push(
      <Callout key="shared" icon="link">
        The link carries the first {formatInteger(set.shared)} of{' '}
        {formatInteger(set.rows.length)} structures. The whole set is kept in
        this browser.
      </Callout>,
    );
  }
  if (set.problems.length > 0) {
    lines.push(<ProblemList key="problems" problems={set.problems} />);
  }

  if (lines.length === 0) return null;
  return <div className="compare-status">{lines}</div>;
}

function ProblemList(props: { problems: readonly string[] }): ReactElement {
  const { problems } = props;
  const shown = problems.slice(0, SHOWN_PROBLEMS);
  const rest = problems.length - shown.length;

  return (
    <Callout intent="warning" icon="warning-sign">
      <ul className="compare-problems">
        {shown.map((line) => (
          <li key={line}>{line}</li>
        ))}
        {rest > 0 ? <li>and {formatInteger(rest)} more.</li> : null}
      </ul>
    </Callout>
  );
}
