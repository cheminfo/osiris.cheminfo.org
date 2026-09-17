/**
 * One prediction, wherever it runs.
 *
 * The worker serves this, and a page with no `Worker` at all — a unit test,
 * Node — runs the same function on its own thread. One code path, so what the
 * tests prove is what the page does.
 */

import { errorMessage } from 'react-cheminfo/core';

import {
  loadPredictors,
  predictIdCode,
  riskDetailOfIdCode,
} from '../core/index.ts';

import type { PredictRequest, PredictResponse } from './protocol.ts';

/**
 * Answer one job.
 *
 * A structure that cannot be read, or that holds no atoms, throws: that is one
 * bad row, and the run carries on without it. Resources that did not load
 * return `unavailable` instead, because that is every row and the run must stop.
 * @param request - The job.
 * @returns The answer.
 * @throws {Error} When the molecule itself could not be read or predicted.
 */
export async function runPredictionJob(
  request: PredictRequest,
): Promise<PredictResponse> {
  let predictors;
  try {
    predictors = await loadPredictors(request.resources);
  } catch (error) {
    return { kind: 'unavailable', message: errorMessage(error) };
  }

  if (request.kind === 'riskDetail') {
    return {
      kind: 'riskDetail',
      detail: riskDetailOfIdCode(request.idCode, request.risk, predictors),
    };
  }

  return {
    kind: 'properties',
    key: request.key,
    properties: predictIdCode(request.idCode, predictors, {
      ...(request.label === undefined ? {} : { label: request.label }),
    }),
  };
}
