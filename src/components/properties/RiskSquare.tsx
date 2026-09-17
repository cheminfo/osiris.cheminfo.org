/**
 * One toxicity risk, as a coloured square with its name beside it.
 *
 * The square is a button whenever the page can explain it, because the
 * explanation is the honest half of the colour: aspirin, caffeine and
 * paracetamol come back red through the known-molecule branch, not through a
 * toxicophore, and only opening it says so.
 *
 * `compact` drops the words and keeps the square, which is what a cell of the
 * comparison table needs; the name and the level stay on the accessible label,
 * so the cell is still readable to a screen reader and on hover.
 */

import type { ReactElement } from 'react';

import type { RiskLevel, RiskType } from '../../osiris/index.ts';
import { RISK_LABELS } from '../../osiris/index.ts';

import { riskAppearance } from './riskAppearance.ts';

/** What {@link RiskSquare} needs. */
export interface RiskSquareProps {
  /** Which of the four risks this shows. */
  risk: RiskType;
  /** How it came back, or `undefined` when it has not been assessed. */
  level: RiskLevel | undefined;
  /**
   * Whether a prediction is running for this molecule. It is what tells an
   * unassessed square to say it is working rather than that there is nothing
   * to work on.
   * @default false
   */
  pending?: boolean;
  /**
   * Whether this risk's explanation is the one open.
   * @default false
   */
  selected?: boolean;
  /**
   * Called with the risk when the square is clicked. Without it the square is
   * not a button.
   * @default undefined
   */
  onSelect?: (risk: RiskType) => void;
  /**
   * Draw the square alone, for a cell of a table.
   * @default false
   */
  compact?: boolean;
}

/**
 * One risk's square.
 * @param props - See {@link RiskSquareProps}.
 * @returns The square, as a button when the page can explain it.
 */
export function RiskSquare(props: RiskSquareProps): ReactElement {
  const {
    risk,
    level,
    pending = false,
    selected = false,
    onSelect,
    compact = false,
  } = props;
  const { tone, label, explainable } = riskAppearance(level, pending);
  const name = RISK_LABELS[risk];
  const description = `${name}: ${label}`;
  const clickable = onSelect !== undefined && explainable;

  const body = (
    <>
      <span className="risk-square__swatch" data-level={tone} />
      {compact ? null : (
        <span className="risk-square__text">
          <span className="risk-square__name">{name}</span>
          <span className="risk-square__level">{label}</span>
        </span>
      )}
    </>
  );

  if (!clickable) {
    return (
      <span
        className={compact ? 'risk-square risk-square--compact' : 'risk-square'}
        title={description}
        aria-label={compact ? description : undefined}
      >
        {body}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={compact ? 'risk-square risk-square--compact' : 'risk-square'}
      title={`${description} — why?`}
      aria-label={compact ? description : undefined}
      aria-pressed={selected}
      onClick={() => {
        onSelect(risk);
      }}
    >
      {body}
    </button>
  );
}
