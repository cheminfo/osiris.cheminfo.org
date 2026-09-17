/**
 * Why one risk came back as it did.
 *
 * Two branches of the predictor reach the same red square and mean different
 * things. *This molecule is known to be mutagenic* means the compound's own
 * idCode is in a list derived from RTECS — data on this exact compound, and
 * nothing on the drawing to point at. *High-risk fragments indicating
 * Mutagenicity* means a substructure matched, and that substructure is drawn
 * beside the molecule with its atoms painted on it.
 *
 * Telling them apart is the whole point of opening a square: aspirin, caffeine
 * and paracetamol are all red through the first branch, and highlighting the
 * whole molecule there would call the compound its own toxicophore.
 *
 * A fragment heading is repeated on each of the fragments under it, so it is
 * printed once and the matches follow.
 */

import { Callout, Spinner } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { Structure } from 'react-cheminfo/structure';

import type { RiskDetail, RiskFinding, RiskType } from '../../osiris/index.ts';
import { RISK_LABELS } from '../../osiris/index.ts';

import { KNOWN_MOLECULE_NOTE } from './riskAppearance.ts';

/** What {@link RiskFindings} needs. */
export interface RiskFindingsProps {
  /** Which risk is open. */
  risk: RiskType;
  /** The molecule it was assessed on: the idCode, with its coordinates after a space. */
  structure: string;
  /**
   * What the predictor found, or `null` while it is being worked out.
   * @default null
   */
  detail?: RiskDetail | null;
  /**
   * Why the explanation could not be fetched, or `null`.
   * @default null
   */
  error?: string | null;
}

/** How big a drawing in the explanation is, in pixels. */
const DRAWING = { width: 190, height: 130 };

/**
 * The explanation of one risk.
 * @param props - See {@link RiskFindingsProps}.
 * @returns The predictor's own sentences, with every matched fragment drawn.
 */
export function RiskFindings(props: RiskFindingsProps): ReactElement {
  const { risk, structure, detail = null, error = null } = props;

  if (error !== null) {
    return <Callout intent="warning">{error}</Callout>;
  }
  if (detail === null) {
    return (
      <p className="panel-note">
        <Spinner size={14} /> Working out why {RISK_LABELS[risk]} came back as
        it did.
      </p>
    );
  }

  return (
    <div className="risk-findings">
      {detail.findings.map((finding, index) => (
        <Finding
          // The predictor prints each heading once and each matching fragment
          // once under it, so the pair names the line without an index.
          key={`${finding.kind}:${finding.description}:${finding.idCode ?? ''}`}
          finding={finding}
          structure={structure}
          heading={
            detail.findings[index - 1]?.description === finding.description
              ? null
              : finding.description
          }
        />
      ))}
    </div>
  );
}

interface FindingProps {
  finding: RiskFinding;
  structure: string;
  heading: string | null;
}

function Finding(props: FindingProps): ReactElement {
  const { finding, structure, heading } = props;

  return (
    <div className="risk-finding">
      {heading === null ? null : (
        <p className="risk-finding__heading">{heading}</p>
      )}
      {finding.kind === 'known' ? (
        <p className="panel-note">{KNOWN_MOLECULE_NOTE}</p>
      ) : null}
      {finding.idCode === null ? null : (
        <div className="risk-finding__drawings">
          <figure className="risk-finding__figure">
            <Structure
              idCode={finding.idCode}
              width={DRAWING.width}
              height={DRAWING.height}
            />
            <figcaption>
              {finding.severity === 'medium' ? 'Medium-risk' : 'High-risk'}{' '}
              fragment
            </figcaption>
          </figure>
          <figure className="risk-finding__figure">
            <Structure
              idCode={structure}
              width={DRAWING.width}
              height={DRAWING.height}
              atomHighlight={[...finding.atoms]}
              bondHighlight={[...finding.bonds]}
            />
            <figcaption>
              {finding.atoms.length === 0
                ? 'Not located on this drawing'
                : 'Where it sits on the molecule'}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
