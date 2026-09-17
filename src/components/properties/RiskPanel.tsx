/**
 * The four toxicity risks, and the sentence that keeps them honest.
 *
 * OSIRIS assesses mutagenicity, tumorigenicity, irritating effects and
 * reproductive effects, in that order, and answers each with one of three
 * levels — the same three the drug score multiplies by. A red square is very
 * often the known-molecule branch rather than a matched fragment, which is why
 * every assessed square opens its explanation.
 *
 * The caveat under them is the author's own, quoted rather than paraphrased: it
 * is the sentence that stops a red square being read as a verdict, and softening
 * it would be our words over his.
 */

import { H5 } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import type { RiskLevel, RiskType } from '../../osiris/index.ts';
import { RISK_TYPES } from '../../osiris/index.ts';

import { RiskSquare } from './RiskSquare.tsx';
import { RISK_CAVEAT } from './riskAppearance.ts';

/** What {@link RiskPanel} needs. */
export interface RiskPanelProps {
  /**
   * How the four came back, or `null` when none of them has been assessed.
   * @default null
   */
  risks?: Record<RiskType, RiskLevel> | null;
  /**
   * Whether a prediction is running for the molecule the panel is showing.
   * @default false
   */
  pending?: boolean;
  /**
   * Which risk has its explanation open.
   * @default null
   */
  openRisk?: RiskType | null;
  /**
   * Called with the risk to open, or `null` to close the one that is open.
   * Without it the squares are not clickable.
   * @default undefined
   */
  onOpenRisk?: (risk: RiskType | null) => void;
}

/**
 * The four risk squares.
 * @param props - See {@link RiskPanelProps}.
 * @returns The panel, with the caveat under it.
 */
export function RiskPanel(props: RiskPanelProps): ReactElement {
  const { risks = null, pending = false, openRisk = null, onOpenRisk } = props;

  return (
    <section className="risk-panel">
      <H5>Predicted toxicity risks</H5>
      <div className="risk-grid">
        {RISK_TYPES.map((risk) => (
          <RiskSquare
            key={risk}
            risk={risk}
            level={risks?.[risk]}
            pending={pending}
            selected={openRisk === risk}
            onSelect={
              onOpenRisk === undefined
                ? undefined
                : (chosen) => {
                    onOpenRisk(chosen === openRisk ? null : chosen);
                  }
            }
          />
        ))}
      </div>
      <p className="panel-note">{RISK_CAVEAT}</p>
    </section>
  );
}
