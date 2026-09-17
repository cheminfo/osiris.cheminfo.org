/**
 * Reading the SMILES a link carries into the structure the page works on.
 *
 * `?smiles=c1ccccc1` names a molecule the page cannot yet predict: every
 * predictor takes an idCode, and the editor is uncontrolled, so nothing else
 * will produce one — its `onChange` fires on a user event and never on the
 * value it was mounted with. So the page reads the SMILES itself, once, and
 * writes the pair back into the state the pen writes.
 *
 * The reader is loaded on demand. `src/input` imports openchemlib outright, so
 * a static import here would put 1.2 MB in the chunk that draws the page, for a
 * visitor who may never open a link with a structure in it.
 *
 * `setDrawnStructure` and not `loadExplorerStructure`: the revision must not
 * move. Bumping it would remount the editor with the structure the editor is
 * already showing, and on a link that is exactly the moment the canvas has just
 * appeared.
 */

import { useEffect, useState } from 'react';
import { errorMessage } from 'react-cheminfo/core';

import { UNREADABLE_MESSAGE } from '../../input/errors.ts';
import { setDrawnStructure } from '../../state/index.ts';

import type { ExplorerRequest } from './explorerRequest.ts';

/** How the reading of a linked SMILES is going. */
export interface ResolvedStructure {
  /** Whether a SMILES is being read into a structure right now. */
  pending: boolean;
  /** Why it could not be read, in one sentence, or `null`. */
  problem: string | null;
}

/** Nothing to read, so nothing is pending and nothing failed. */
const SETTLED: ResolvedStructure = { pending: false, problem: null };

interface Answer {
  /** The SMILES this answer is about, so a stale one is never shown. */
  smiles: string;
  /** Why it could not be read, or `null` when it was. */
  problem: string | null;
}

/**
 * Turn the SMILES a link carries into the structure the rest of the page reads.
 *
 * Does nothing at all unless the request asks for it, so a drawn molecule never
 * touches the reader.
 * @param request - What the page's state says has to happen.
 * @returns Whether the reading is still running, and why it failed if it did.
 */
export function useResolvedStructure(
  request: ExplorerRequest,
): ResolvedStructure {
  const smiles = request.kind === 'resolve' ? request.smiles : '';
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    if (smiles === '') return;
    let live = true;
    readOne(smiles)
      .then((problem) => {
        if (live) setAnswer({ smiles, problem });
      })
      .catch((error: unknown) => {
        if (live) setAnswer({ smiles, problem: errorMessage(error) });
      });
    return () => {
      live = false;
    };
  }, [smiles]);

  if (smiles === '') return SETTLED;
  if (answer?.smiles !== smiles) return { pending: true, problem: null };
  return { pending: false, problem: answer.problem };
}

/**
 * Read one SMILES and hand the structure to the state.
 * @param smiles - What the address named.
 * @returns `null` once the structure is in the state, or the reason it is not.
 */
async function readOne(smiles: string): Promise<string | null> {
  const { readMolecules } = await import('../../input/index.ts');
  // One molecule: a link to this page names a structure, and a reader asked for
  // two thousand would parse a pasted list nobody put there.
  const result = await readMolecules(smiles, { maxMolecules: 1 });
  const row = result.molecules[0];
  if (row === undefined) {
    return result.problems[0]?.reason ?? UNREADABLE_MESSAGE;
  }
  setDrawnStructure({
    idCode:
      row.coordinates === '' ? row.idCode : `${row.idCode} ${row.coordinates}`,
    smiles: row.smiles,
  });
  return null;
}
