/**
 * What happens when a document opens on an address that names a set.
 *
 * The hook itself is React, but the decision the reload turns on is not: the
 * address is a lossy mirror of the set — the first {@link SHARED_SMILES_LIMIT}
 * structures, with no names — so what the page does before reading it decides
 * whether a reload keeps the reader's work or overwrites it with the mirror.
 */

import { beforeEach, expect, test } from 'vitest';

import { readMolecules } from '../../../input/index.ts';
import type { MoleculeRow } from '../../../state/index.ts';
import {
  SHARED_SMILES_LIMIT,
  clearMolecules,
  forgetSet,
  rememberSet,
} from '../../../state/index.ts';
import type { ReadRequest } from '../compareReads.ts';
import { readRequest } from '../compareReads.ts';
import { sharePlan, storedOf } from '../compareSet.ts';
import { openLinkedSet } from '../useCompareSet.ts';

/** How many rows past the limit the set under test runs. */
const EXTRA_ROWS = 10;

beforeEach(() => {
  clearMolecules();
  forgetSet();
});

test('a reload rebuilds the whole stored set, not the truncated address', async () => {
  // The previous visit: more structures than an address can carry, each under
  // a name of its own, as an SD file gives them.
  const first = await readMolecules(
    namedList(SHARED_SMILES_LIMIT + EXTRA_ROWS),
  );
  expect(first.molecules).toHaveLength(SHARED_SMILES_LIMIT + EXTRA_ROWS);
  rememberSet(storedOf(first.molecules));
  const plan = sharePlan(first.molecules);
  expect(plan.count).toBe(SHARED_SMILES_LIMIT);

  // A new document: nothing in memory, the address as the last visit left it.
  clearMolecules();
  const published = await openLink(plan.text);

  expect(published).toHaveLength(SHARED_SMILES_LIMIT + EXTRA_ROWS);
  expect(published.map(labelOf)).toStrictEqual(first.molecules.map(labelOf));
  // What the publish that follows would store is what was already stored: a
  // set rebuilt from the address can never shrink it, nor relabel it.
  expect(storedOf(published)).toStrictEqual(storedOf(first.molecules));
});

test("someone else's link is added to the stored set, not written over it", async () => {
  const held = await readMolecules('CCO ethanol\nc1ccccc1 benzene');
  rememberSet(storedOf(held.molecules));
  clearMolecules();

  const published = await openLink('CC(=O)O');

  expect(published.map(labelOf)).toStrictEqual([
    'ethanol',
    'benzene',
    'CC(O)=O',
  ]);
});

/**
 * Open an address the way the page does, and hand back the set it published.
 * @param linked - The `smiles` parameter, as the address carries it.
 * @returns The rows the read produced.
 */
async function openLink(linked: string): Promise<readonly MoleculeRow[]> {
  let published: readonly MoleculeRow[] = [];
  await openLinkedSet(linked, async (request: ReadRequest) => {
    const outcome = await readRequest(
      request,
      new AbortController().signal,
      () => {
        // The progress line is the page's, not this test's.
      },
    );
    published = outcome.molecules;
  });
  return published;
}

/**
 * A pasted list of distinct ethers, each carrying a name the SMILES does not.
 * @param count - How many lines to write.
 * @returns The list, one `structure name` per line.
 */
function namedList(count: number): string {
  const lines: string[] = [];
  for (let index = 0; index < count; index++) {
    const left = 1 + (index % 13);
    const right = left + Math.floor(index / 13);
    lines.push(`${'C'.repeat(left)}O${'C'.repeat(right)} molecule ${index}`);
  }
  return lines.join('\n');
}

function labelOf(row: MoleculeRow): string {
  return row.label;
}
