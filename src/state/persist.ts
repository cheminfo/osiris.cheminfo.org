/**
 * Whole-bucket persistence for the signal buckets of `src/state`.
 *
 * One namespaced `localStorage` entry per bucket, holding a JSON mirror of the
 * bucket tree — never one key per signal. The entry itself, its versioned key,
 * the merge over the defaults and the failure policy are `react-cheminfo`'s
 * `persistBucket`; what is here is the half that knows about signals — walking
 * the tree to read its leaves, and writing a stored payload back into them.
 */

import { Signal, effect } from '@preact/signals-react';
import { persistBucket as storedBucket } from 'react-cheminfo/core';

/**
 * Rehydrate a bucket from `localStorage`, then keep the whole tree stored.
 *
 * A bucket is a plain object whose leaves are writable `signal()`s, grouped in
 * plain objects as deeply as needed. A stored value is applied only when it has
 * the same shape as the leaf's default, so a corrupt or outdated payload falls
 * back to the defaults field by field, and a leaf added after the last save
 * simply keeps its default (soft migration).
 *
 * Never put a `computed()` in a persisted bucket: it cannot be written back on
 * rehydration.
 *
 * @param key - Storage namespace without its version, e.g. `osiris:preferences`.
 * @param bucket - Bucket object, rehydrated in place.
 * @returns The same bucket, so it can be exported directly.
 */
export function persistBucket<T extends Record<string, unknown>>(
  key: string,
  bucket: T,
): T {
  // The defaults are the bucket as it was declared, so the merge knows the
  // shape every leaf must keep.
  const entry = storedBucket({ key, defaults: snapshotNode(bucket) });
  rehydrate(bucket, entry.read().value);
  effect(() => {
    entry.write(snapshotNode(bucket));
  });
  return bucket;
}

/**
 * Drop the stored payload of one bucket, leaving the live signals untouched.
 *
 * The next write of any leaf stores the tree again, so this is only useful in
 * tests and in a "forget everything" action that also resets the leaves.
 *
 * @param key - The key passed to {@link persistBucket}.
 */
export function clearStoredBucket(key: string): void {
  storedBucket({ key, defaults: {} }).clear();
}

/**
 * Write a merged payload into the signals it came from.
 *
 * The payload has already been merged over the bucket's own defaults, so every
 * leaf it carries is usable; only the walk down to the signals is left.
 */
function rehydrate(node: Record<string, unknown>, stored: unknown): void {
  if (!isPlainRecord(stored)) return;
  for (const [key, current] of Object.entries(node)) {
    const value = stored[key];
    if (value === undefined) continue;
    if (isSignal(current)) {
      current.value = value;
    } else if (isPlainRecord(current)) {
      rehydrate(current, value);
    }
  }
}

function snapshotNode(node: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (isSignal(value)) {
      result[key] = value.value;
    } else if (isPlainRecord(value)) {
      result[key] = snapshotNode(value);
    }
  }
  return result;
}

function isSignal(value: unknown): value is Signal<unknown> {
  return value instanceof Signal;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Signal)
  );
}
