/**
 * Asking a worker why one risk came back as it did, and asking again when the
 * set's cancel took the question with it.
 *
 * An explanation travels on a properties channel, and `cancel` drops every
 * request on every channel — the reader's click included, which then reads as
 * the channel's own words in place of the findings. It is not part of the set
 * being abandoned, so it is simply asked for again.
 *
 * A channel of its own would be the other way, and is worse here: a channel
 * makes its worker on the first request, so the first click would wait for
 * OpenChemLib and the 398 kB of resource tables to load in a cold worker,
 * where the shared one is already warm. The retry costs one more message on a
 * worker that is running anyway.
 */

import type { WorkerChannel } from 'react-cheminfo/core';
import { CancelledRequestError } from 'react-cheminfo/core';

import type {
  PredictRequest,
  PredictResponse,
  RiskDetailRequest,
} from '../worker/protocol.ts';

type Channel = WorkerChannel<PredictRequest, PredictResponse>;

/** What the reader is told when the second ask was dropped as well. */
export const RISK_DETAIL_DROPPED =
  'That explanation was dropped when the run stopped. Close the risk square and open it again.';

/**
 * Ask a worker to explain one risk, once more if a cancel dropped the ask.
 * @param channelOf - Picks the channel to ask on, called again for the retry so it lands on whichever worker is least busy by then.
 * @param request - The explanation to ask for.
 * @param mayRetry - Whether asking again can still be answered: false once the pool is terminated, or once its resources are known not to have loaded.
 * @returns Whatever the worker answered, including its `unavailable`.
 * @throws {Error} When the ask was dropped and cannot be made again.
 */
export async function requestRiskDetail(
  channelOf: () => Channel,
  request: RiskDetailRequest,
  mayRetry: () => boolean,
): Promise<PredictResponse> {
  try {
    return await channelOf().request(request);
  } catch (error) {
    if (!(error instanceof CancelledRequestError)) throw error;
    if (!mayRetry()) throw new Error(RISK_DETAIL_DROPPED, { cause: error });
  }
  return askAgain(channelOf, request);
}

async function askAgain(
  channelOf: () => Channel,
  request: RiskDetailRequest,
): Promise<PredictResponse> {
  try {
    return await channelOf().request(request);
  } catch (error) {
    if (!(error instanceof CancelledRequestError)) throw error;
    throw new Error(RISK_DETAIL_DROPPED, { cause: error });
  }
}
