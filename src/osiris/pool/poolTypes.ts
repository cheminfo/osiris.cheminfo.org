/**
 * What a page asks the prediction pool, and what it hears back.
 *
 * A prediction costs 210 to 380 ms of one thread, so a set of any size is
 * answered a molecule at a time rather than all at once: a row appears as soon
 * as it is read and fills in when its worker returns. Everything here is shaped
 * around that — a per-result callback rather than a promise over the set, a
 * progress figure, a cancel that works, and a way to say which rows the reader
 * can actually see so those are computed first.
 */

import type { WorkerLike } from 'react-cheminfo/core';

import type {
  OsirisProperties,
  ResourceSource,
  RiskDetail,
  RiskType,
} from '../core/index.ts';
import type { PredictRequest, PredictResponse } from '../worker/protocol.ts';

/** One molecule to predict. */
export interface PredictionInput {
  /**
   * The caller's key for the row, echoed on the answer. It is the row's read
   * position, never its idCode: a real list holds the same structure twice
   * under two names, and both rows have to fill in.
   */
  key: string;
  /** The idCode, with the editor's atom coordinates after a space or without. */
  idCode: string;
  /**
   * The name the source carried.
   * @default the canonical SMILES
   */
  label?: string;
}

/** What came back for one molecule. */
export type PredictionOutcome =
  | { key: string; ok: true; properties: OsirisProperties }
  | { key: string; ok: false; message: string };

/** How far the pool has got. */
export interface PredictionProgress {
  /** Molecules answered, whether predicted or refused. */
  done: number;
  /** Molecules accepted since the run started. */
  total: number;
  /** Molecules still queued or still being worked on. */
  pending: number;
  /** Whether anything is still to come. */
  running: boolean;
}

/** How a pool is built, and who it reports to. */
export interface PredictionPoolOptions {
  /**
   * Where the workers register OpenChemLib's resources from — the absolute URL
   * of the site's own `openchemlib-resources.json`, resolved on the main
   * thread. See {@link ResourceSource}.
   */
  resources: ResourceSource;
  /**
   * How many workers to run. Clamped to 1 to 8.
   * @default one fewer than the machine's cores, which measured 2.45x on two workers and 4.57x on four
   */
  size?: number;
  /**
   * Makes one worker. Only called where the page has a `Worker` at all.
   * @default a module worker running `worker/predict.worker.ts`
   */
  createWorker?: () => WorkerLike;
  /**
   * The same job on this thread, used where there is no `Worker` — Node, a
   * unit test.
   * @default `runPredictionJob`, the same function the worker serves
   */
  runInProcess?: (request: PredictRequest) => Promise<PredictResponse>;
  /**
   * Called once per molecule, as each one comes back.
   * @default undefined
   */
  onResult?: (outcome: PredictionOutcome) => void;
  /**
   * Called whenever the count of answered molecules changes.
   * @default undefined
   */
  onProgress?: (progress: PredictionProgress) => void;
  /**
   * Called once when the resource tables did not load. Every answer from every
   * worker would be `unknown`, so the run stops and nothing more is dispatched.
   * @default undefined
   */
  onUnavailable?: (message: string) => void;
  /**
   * Milliseconds one molecule may take before it is given up on.
   * @default 60000
   */
  timeoutMs?: number;
}

/** A pool of workers answering one molecule at a time, each. */
export interface PredictionPool {
  /** How many workers it runs. */
  readonly size: number;
  /** How far it has got. */
  readonly progress: PredictionProgress;
  /**
   * Add molecules to predict. One already queued or in flight is ignored, so a
   * page may resubmit its whole set whenever the set changes.
   * @param molecules - The molecules.
   */
  submit: (molecules: readonly PredictionInput[]) => void;
  /**
   * Say which rows to answer first — the ones the reader can see. Molecules
   * already being worked on are left alone; only what is still queued moves.
   * @param keys - The keys, most wanted first.
   */
  prioritize: (keys: readonly string[]) => void;
  /**
   * Why one risk came back as it did. Jumps the queue, because it is a click.
   * A {@link PredictionPool.cancel} is about the set, not about the click, so
   * an explanation it drops is asked for again.
   * @param idCode - The molecule, coordinates included or not.
   * @param risk - Which of the four risks to explain.
   * @returns The findings, with the matched atoms and bonds of every fragment.
   * @throws {Error} When even the second ask was dropped, with a sentence to show the reader.
   */
  riskDetail: (idCode: string, risk: RiskType) => Promise<RiskDetail>;
  /**
   * Drop everything queued and stop reporting. The molecule each worker is
   * already on cannot be interrupted — the library call is synchronous — so it
   * finishes and its answer is thrown away, within about 400 ms. A
   * {@link PredictionPool.submit} made in the same turn is still dispatched, on
   * the slots those abandoned answers free.
   */
  cancel: () => void;
  /** Cancel, and end every worker. */
  terminate: () => void;
}
