/**
 * Everything the explorer knows about the molecule it is showing: what was
 * predicted, what is still running, and what went wrong.
 *
 * It is one hook rather than four reads in the page because the four answers
 * depend on each other. A structure that will not read leaves the panel showing
 * the last one that did; a structure that is still being predicted is not a
 * structure that failed; and a link that named an idCode never told the page a
 * SMILES, so the one the comparison page is handed comes off the prediction.
 *
 * The page is then layout, and the arithmetic that decides what it shows is
 * {@link settleMolecule} — a plain function, testable without a DOM.
 */

import { useMemo, useState } from 'react';

import type {
  OsirisProperties,
  RiskDetail,
  RiskType,
} from '../../osiris/index.ts';
import { usePredictions } from '../../osiris/ui/index.ts';

import type { ExplorerRequest } from './explorerRequest.ts';
import type { ResolvedStructure } from './useResolvedStructure.ts';
import { useResolvedStructure } from './useResolvedStructure.ts';

/** What the page draws, and what it says while it cannot. */
export interface ExplorerMolecule {
  /** What to show in the panel, or `null` when there is nothing to show. */
  properties: OsirisProperties | null;
  /** The atom layout the molecule is drawn with; empty when none is known. */
  coordinates: string;
  /** Whether a structure is still being read or predicted. */
  pending: boolean;
  /** What went wrong with this structure, in one sentence, or `null`. */
  problem: string | null;
  /** Why nothing at all can be predicted, or `null`. */
  error: string | null;
  /** The canonical SMILES to hand the comparison page; empty when none is known. */
  smiles: string;
  /**
   * Why one risk came back as it did.
   * @param structure - The molecule: an idCode, with its coordinates after a space.
   * @param risk - Which of the four risks to explain.
   * @returns The findings, with the matched atoms and bonds of every fragment.
   */
  loadDetail: (structure: string, risk: RiskType) => Promise<RiskDetail>;
}

/** Everything {@link settleMolecule} weighs up. */
export interface MoleculeInputs {
  /** What the page's state says has to happen. */
  request: ExplorerRequest;
  /** How the reading of a linked SMILES is going. */
  resolved: ResolvedStructure;
  /** What the address named, when it named a SMILES. */
  linkedSmiles: string;
  /** What was predicted for the structure on screen, or `undefined`. */
  properties: OsirisProperties | undefined;
  /** Why this structure was refused, or `undefined`. */
  failure: string | undefined;
  /** The last structure that was predicted, or `null`. */
  kept: OsirisProperties | null;
}

/**
 * Predict the structure the explorer is on, and say what is happening while it
 * cannot.
 * @param request - What the page's state says has to happen.
 * @param linkedSmiles - The SMILES the address named, or an empty string.
 * @returns See {@link ExplorerMolecule}.
 */
export function useExplorerMolecule(
  request: ExplorerRequest,
  linkedSmiles: string,
): ExplorerMolecule {
  const resolved = useResolvedStructure(request);
  const idCode = request.kind === 'ready' ? request.structure.idCode : '';

  // One molecule, keyed by its idCode without the drawing: moving an atom is
  // not a new prediction, and redrawing something already answered is instant.
  const molecules = useMemo(
    () => (idCode === '' ? [] : [{ key: idCode, idCode }]),
    [idCode],
  );
  const { results, failures, error, riskDetail } = usePredictions({
    molecules,
  });

  const properties = idCode === '' ? undefined : results.get(idCode);
  const kept = useLastPredicted(properties);
  const settled = settleMolecule({
    request,
    resolved,
    linkedSmiles,
    properties,
    failure: idCode === '' ? undefined : failures.get(idCode),
    kept,
  });

  return { ...settled, error, loadDetail: riskDetail };
}

/**
 * What the panel shows, given everything that is and is not known.
 * @param inputs - See {@link MoleculeInputs}.
 * @returns The molecule, without the parts only a pool can answer.
 */
export function settleMolecule(
  inputs: MoleculeInputs,
): Omit<ExplorerMolecule, 'error' | 'loadDetail'> {
  const { request, resolved, linkedSmiles, properties, failure, kept } = inputs;
  const problem = resolved.problem ?? failure ?? null;
  // The last good prediction stays on screen behind the problem: a structure
  // that will not read is one bad entry, not a reason to empty the panel.
  const shown = properties ?? (problem === null ? null : kept);

  return {
    properties: shown,
    coordinates: request.kind === 'ready' ? request.structure.coordinates : '',
    pending:
      resolved.pending ||
      (request.kind === 'ready' &&
        properties === undefined &&
        problem === null),
    problem,
    smiles: shown?.smiles ?? linkedSmiles,
  };
}

/**
 * The last molecule that was predicted.
 *
 * Adjusted during the render that brings a new prediction in, which is React's
 * own way of holding a value across renders without an effect: nothing is
 * committed in between, so the failure that follows still reads what was there.
 * @param properties - What is predicted right now, or `undefined`.
 * @returns The last prediction that succeeded, or `null`.
 */
function useLastPredicted(
  properties: OsirisProperties | undefined,
): OsirisProperties | null {
  const [kept, setKept] = useState<OsirisProperties | null>(null);
  if (properties !== undefined && properties !== kept) setKept(properties);
  return kept;
}
