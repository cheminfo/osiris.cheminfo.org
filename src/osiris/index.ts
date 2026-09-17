/**
 * The prediction domain: what OSIRIS says about a molecule, and the pool of
 * workers that says it.
 *
 * Nothing under `core`, `worker` or `pool` imports React; the one hook that
 * hands the pool to a page is `ui/usePredictions.ts`.
 */

export * from './core/index.ts';
export * from './pool/index.ts';
export type {
  PredictRequest,
  PredictResponse,
  PropertiesRequest,
  RiskDetailRequest,
} from './worker/protocol.ts';
export { isPredictRequest } from './worker/protocol.ts';
export { runPredictionJob } from './worker/runPredictionJob.ts';
