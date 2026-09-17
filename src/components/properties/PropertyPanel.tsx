/**
 * Everything OSIRIS predicts about one molecule: the four toxicity risks, then
 * the ten numbers, in the order the original panel showed them.
 *
 * One panel, two pages. The explorer shows the molecule on its canvas and the
 * comparison page shows the row the reader focused, so writing a second panel
 * for the table would be two places for the same ten rows to drift apart.
 *
 * The sections stand whether or not there is anything in them. A prediction
 * costs a fifth of a second, and a panel that appeared only once it was ready
 * would move the page under the reader's eye every time they drew a bond.
 *
 * Which explanation is open is the caller's state — it belongs to the page, and
 * on the explorer it is what a click on a square changes — but *fetching* it is
 * the panel's own business, so neither page repeats the dance.
 */

import { Callout, H5 } from '@blueprintjs/core';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { errorMessage } from 'react-cheminfo/core';
import { PagePart } from 'react-cheminfo/ui';
import { MF } from 'react-mf';

import type {
  OsirisProperties,
  RiskDetail,
  RiskType,
} from '../../osiris/index.ts';

import { PropertyRows } from './PropertyRows.tsx';
import { RiskFindings } from './RiskFindings.tsx';
import { RiskPanel } from './RiskPanel.tsx';

/** What {@link PropertyPanel} needs. */
export interface PropertyPanelProps {
  /**
   * What was predicted, or `null` when there is nothing to show yet.
   * @default null
   */
  properties?: OsirisProperties | null;
  /**
   * The atom layout to draw the molecule with, in an explanation. Empty leaves
   * openchemlib to invent one.
   * @default ''
   */
  coordinates?: string;
  /**
   * Whether a prediction is running for the molecule the panel is showing.
   * @default false
   */
  pending?: boolean;
  /**
   * What went wrong with this structure, in one sentence, or `null`.
   * @default null
   */
  problem?: string | null;
  /**
   * What is said when there is nothing predicted and nothing running.
   * @default 'Nothing to predict yet.'
   */
  emptyMessage?: ReactNode;
  /**
   * Which risk has its explanation open.
   * @default null
   */
  openRisk?: RiskType | null;
  /**
   * Called with the risk to open, or `null` to close it. Without it the squares
   * are not clickable.
   * @default undefined
   */
  onOpenRisk?: (risk: RiskType | null) => void;
  /**
   * Why a risk came back as it did. Without it no explanation is offered.
   * @default undefined
   */
  loadDetail?: (structure: string, risk: RiskType) => Promise<RiskDetail>;
}

/** One fetched explanation, and the request it answers. */
interface DetailAnswer {
  key: string;
  detail: RiskDetail | null;
  error: string | null;
}

/**
 * The risks and the properties of one molecule.
 * @param props - See {@link PropertyPanelProps}.
 * @returns The two panels, and the open explanation between them.
 */
export function PropertyPanel(props: PropertyPanelProps): ReactElement {
  const {
    properties = null,
    coordinates = '',
    pending = false,
    problem = null,
    emptyMessage = 'Nothing to predict yet.',
    openRisk = null,
    onOpenRisk,
    loadDetail,
  } = props;

  const structure =
    properties === null
      ? ''
      : coordinates === ''
        ? properties.idCode
        : `${properties.idCode} ${coordinates}`;
  const answer = useRiskDetail(structure, openRisk, loadDetail);

  return (
    <div className="property-panel">
      {problem === null ? null : (
        <Callout intent="warning" compact>
          {problem}
        </Callout>
      )}

      {properties === null ? (
        <p className="panel-note">{pending ? 'Predicting…' : emptyMessage}</p>
      ) : (
        <header className="property-panel__head">
          <MF mf={properties.molecularFormula} />
          <span className="property-panel__label">{properties.label}</span>
        </header>
      )}

      <PagePart part="risks">
        <RiskPanel
          risks={properties?.risks ?? null}
          pending={pending}
          openRisk={openRisk}
          onOpenRisk={onOpenRisk}
        />
      </PagePart>

      {openRisk === null ||
      structure === '' ||
      loadDetail === undefined ? null : (
        <PagePart part="detail">
          <RiskFindings
            risk={openRisk}
            structure={structure}
            detail={answer?.detail ?? null}
            error={answer?.error ?? null}
          />
        </PagePart>
      )}

      <PagePart part="properties">
        <section className="property-section">
          <H5>Predicted properties</H5>
          <PropertyRows properties={properties} />
        </section>
      </PagePart>
    </div>
  );
}

/**
 * Fetch the open risk's explanation, and answer only about the request that is
 * open now.
 *
 * The answer carries the request it belongs to rather than being cleared when a
 * new one starts: clearing would mean writing state from inside the effect, and
 * comparing keys says the same thing without the extra render.
 * @param structure - The molecule: an idCode, with its coordinates after a space.
 * @param openRisk - Which risk is open, or `null`.
 * @param loadDetail - What answers the question, or `undefined` when nothing does.
 * @returns The answer to the open request, or `null` while it is being worked out.
 */
function useRiskDetail(
  structure: string,
  openRisk: RiskType | null,
  loadDetail:
    ((structure: string, risk: RiskType) => Promise<RiskDetail>) | undefined,
): DetailAnswer | null {
  const key =
    openRisk === null || structure === '' ? '' : `${structure} ${openRisk}`;
  const [answer, setAnswer] = useState<DetailAnswer | null>(null);

  useEffect(() => {
    if (key === '' || openRisk === null || loadDetail === undefined) return;
    let live = true;
    loadDetail(structure, openRisk).then(
      (detail) => {
        if (live) setAnswer({ key, detail, error: null });
      },
      (error: unknown) => {
        if (live) setAnswer({ key, detail: null, error: errorMessage(error) });
      },
    );
    return () => {
      live = false;
    };
  }, [key, structure, openRisk, loadDetail]);

  return answer !== null && answer.key === key ? answer : null;
}
