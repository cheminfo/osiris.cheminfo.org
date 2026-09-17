/**
 * A pool of prediction workers, answering one molecule at a time each.
 *
 * `createWorkerChannel` from `react-cheminfo/core` does the per-worker half —
 * request identifiers so answers match callers whatever order they arrive in,
 * timeouts, cancellation, and the in-process fallback where a page has no
 * `Worker` at all. What it does not do is spread work over several workers, so
 * that is what this adds: one channel per worker, a queue the pool owns, and at
 * most one outstanding job per channel, which is what makes reordering possible
 * at all. A channel asked for everything at once would post everything at once,
 * and the row the reader is looking at would be answered forty-eighth.
 */

import type { WorkerChannel } from 'react-cheminfo/core';
import {
  CancelledRequestError,
  createWorkerChannel,
  errorMessage,
} from 'react-cheminfo/core';

import type { RiskDetail, RiskType } from '../core/index.ts';
import { PredictorsUnavailableError } from '../core/index.ts';
import type { PredictRequest, PredictResponse } from '../worker/protocol.ts';
import { runPredictionJob } from '../worker/runPredictionJob.ts';

import { predictionPoolSize } from './poolSize.ts';
import type {
  PredictionInput,
  PredictionPool,
  PredictionPoolOptions,
  PredictionProgress,
} from './poolTypes.ts';
import { createPredictionQueue } from './predictionQueue.ts';
import { requestRiskDetail } from './riskDetailRequest.ts';

type Channel = WorkerChannel<PredictRequest, PredictResponse>;

interface Slot {
  channel: Channel;
  busy: boolean;
}

/**
 * Start a pool of prediction workers.
 *
 * Workers are created lazily by the channels, on their first job, so a page
 * that never predicts anything never loads OpenChemLib.
 * @param options - See {@link PredictionPoolOptions}.
 * @returns The pool.
 */
export function createPredictionPool(
  options: PredictionPoolOptions,
): PredictionPool {
  const {
    resources,
    onResult,
    onProgress,
    onUnavailable,
    createWorker,
    runInProcess,
    timeoutMs = 60_000,
  } = options;
  const size = predictionPoolSize(options.size);
  const run = runInProcess ?? runPredictionJob;

  const slots: Slot[] = [];
  for (let index = 0; index < size; index++) {
    slots.push({
      channel: createWorkerChannel<PredictRequest, PredictResponse>(
        createWorker ?? createPredictionWorker,
        {
          name: `osiris-prediction-${index}`,
          defaultTimeoutMs: timeoutMs,
          runInProcess: run,
        },
      ),
      busy: false,
    });
  }

  const queue = createPredictionQueue();
  const inFlight = new Set<string>();
  let generation = 0;
  let done = 0;
  let total = 0;
  let running = false;
  let terminated = false;
  let unavailable: string | null = null;

  function progress(): PredictionProgress {
    return { done, total, pending: queue.size + inFlight.size, running };
  }

  function report(): void {
    onProgress?.(progress());
  }

  function pump(): void {
    if (unavailable !== null) return;
    for (const slot of slots) {
      if (slot.busy) continue;
      const next = queue.take();
      if (next === undefined) break;
      dispatch(slot, next);
    }
  }

  function dispatch(slot: Slot, input: PredictionInput): void {
    const era = generation;
    slot.busy = true;
    inFlight.add(input.key);
    const request: PredictRequest = {
      kind: 'properties',
      resources,
      key: input.key,
      idCode: input.idCode,
      ...(input.label === undefined ? {} : { label: input.label }),
    };
    slot.channel.request(request).then(
      (response) => {
        settle(slot, input, era, response, null);
      },
      (error: unknown) => {
        settle(slot, input, era, null, error);
      },
    );
  }

  function settle(
    slot: Slot,
    input: PredictionInput,
    era: number,
    response: PredictResponse | null,
    error: unknown,
  ): void {
    slot.busy = false;
    inFlight.delete(input.key);

    // An answer from a cancelled run is not counted and not reported, but the
    // slot it just freed is still dispatched from: a submit made in the same
    // turn as the cancel found every slot busy and queued its molecules here.
    if (era === generation) {
      if (response?.kind === 'unavailable') {
        stop(response.message);
        return;
      }
      if (response?.kind === 'properties') {
        done += 1;
        onResult?.({
          key: input.key,
          ok: true,
          properties: response.properties,
        });
      } else if (error !== null && !(error instanceof CancelledRequestError)) {
        done += 1;
        onResult?.({ key: input.key, ok: false, message: errorMessage(error) });
      }
    }

    pump();
    if (queue.size === 0 && inFlight.size === 0) running = false;
    report();
  }

  function clear(): void {
    generation += 1;
    queue.clear();
    inFlight.clear();
    running = false;
    for (const slot of slots) slot.channel.cancel();
  }

  function stop(message: string): void {
    clear();
    unavailable = message;
    report();
    onUnavailable?.(message);
  }

  function leastBusy(): Slot {
    let best = slots[0] as Slot;
    for (const slot of slots) {
      if (slot.channel.pendingCount < best.channel.pendingCount) best = slot;
    }
    return best;
  }

  return {
    size,
    get progress() {
      return progress();
    },

    submit(molecules) {
      if (unavailable !== null) return;
      if (!running && queue.size === 0 && inFlight.size === 0) {
        done = 0;
        total = 0;
      }
      for (const input of molecules) {
        if (inFlight.has(input.key)) continue;
        if (queue.add(input)) total += 1;
      }
      running = queue.size > 0 || inFlight.size > 0;
      pump();
      report();
    },

    prioritize(keys) {
      queue.prioritize(keys);
    },

    async riskDetail(idCode: string, risk: RiskType): Promise<RiskDetail> {
      const response = await requestRiskDetail(
        () => leastBusy().channel,
        { kind: 'riskDetail', resources, idCode, risk },
        () => !terminated && unavailable === null,
      );
      if (response.kind === 'unavailable') {
        stop(response.message);
        throw new PredictorsUnavailableError(response.message);
      }
      if (response.kind !== 'riskDetail') {
        throw new Error('The worker answered something other than a detail.');
      }
      return response.detail;
    },

    cancel() {
      clear();
      report();
    },

    terminate() {
      terminated = true;
      clear();
      for (const slot of slots) slot.channel.terminate();
    },
  };
}

function createPredictionWorker(): Worker {
  return new Worker(new URL('../worker/predict.worker.ts', import.meta.url), {
    type: 'module',
  });
}
