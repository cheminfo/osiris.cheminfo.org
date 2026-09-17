/**
 * What the page asks a prediction worker, and what it answers.
 *
 * One molecule per request. Two of the three answers are ordinary results; the
 * third, `unavailable`, is how a worker says its resource tables did not load.
 * That one travels as a *successful* answer on purpose: a rejection would be
 * indistinguishable from the ordinary failure of one unreadable structure,
 * whereas this one means every answer from every worker is worthless and the
 * run must stop and say so.
 */

import type {
  OsirisProperties,
  ResourceSource,
  RiskDetail,
  RiskType,
} from '../core/index.ts';

/** What every request carries, whichever job it asks for. */
interface BaseRequest {
  /**
   * Where the worker registers OpenChemLib's resources from. In a browser this
   * is always the absolute URL of the site's own `openchemlib-resources.json`,
   * resolved on the main thread: a worker has no `document`, so it cannot read
   * the deployment's mount path itself. The parsed tables are accepted as well,
   * for the in-process fallback where there is no worker to post them to.
   */
  resources: ResourceSource;
}

/** Predict everything the tool shows for one molecule. */
export interface PropertiesRequest extends BaseRequest {
  kind: 'properties';
  /** The caller's key for the row, echoed back so answers can arrive in any order. */
  key: string;
  /** The idCode, with the editor's atom coordinates after a space or without. */
  idCode: string;
  /**
   * The name the source carried.
   * @default the canonical SMILES
   */
  label?: string;
}

/** Explain why one risk came back as it did. */
export interface RiskDetailRequest extends BaseRequest {
  kind: 'riskDetail';
  /** The idCode, coordinates included or not. */
  idCode: string;
  /** Which of the four risks to explain. */
  risk: RiskType;
}

/** One job for a prediction worker. */
export type PredictRequest = PropertiesRequest | RiskDetailRequest;

/** What a prediction worker answers. */
export type PredictResponse =
  | { kind: 'properties'; key: string; properties: OsirisProperties }
  | { kind: 'riskDetail'; detail: RiskDetail }
  | { kind: 'unavailable'; message: string };

/**
 * Whether a message is a job this worker handles, so anything else is refused
 * rather than read as one.
 * @param value - Whatever was posted.
 * @returns True when it is a well-formed request.
 */
export function isPredictRequest(value: unknown): value is PredictRequest {
  if (typeof value !== 'object' || value === null) return false;
  const request = value as {
    kind?: unknown;
    resources?: unknown;
    idCode?: unknown;
    key?: unknown;
    risk?: unknown;
  };
  if (typeof request.idCode !== 'string') return false;
  if (request.resources === undefined) return false;
  if (request.kind === 'properties') return typeof request.key === 'string';
  return request.kind === 'riskDetail' && typeof request.risk === 'string';
}
