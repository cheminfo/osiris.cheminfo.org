/**
 * How many workers to run.
 *
 * One fewer than the machine's cores, so the thread that draws the table keeps
 * one to itself, and never more than eight: measured scaling is 2.45x on two
 * workers and 4.57x on four, and each worker costs its own copy of OpenChemLib
 * and of the 398 kB resource tables.
 */

import { clamp } from 'react-cheminfo/core';

/** The most workers the pool will ever run. */
export const MAX_POOL_SIZE = 8;

/**
 * How many workers a pool should run here.
 * @param requested - What the caller asked for, or `undefined` to read the machine.
 * @returns A count between 1 and {@link MAX_POOL_SIZE}.
 */
export function predictionPoolSize(requested?: number): number {
  const cores = globalThis.navigator?.hardwareConcurrency;
  const wanted = requested ?? (typeof cores === 'number' ? cores - 1 : 1);
  return Math.trunc(clamp(wanted, 1, MAX_POOL_SIZE, 1));
}
