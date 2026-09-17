/**
 * What stands where the table is before there is anything to compare.
 *
 * A sentence and a set to open, never a blank panel: the fastest way to learn
 * what this page does is to see five molecules in it, and the link is a real
 * address, so a reader can bookmark it or hand it to a class.
 */

import { NonIdealState } from '@blueprintjs/core';
import type { MouseEvent, ReactElement } from 'react';

import { toSearch } from '../../share/query.ts';
import { setCompareSmiles, withBase } from '../../state/index.ts';

/**
 * Five drugs a chemist recognises, which between them cover most of the ranges
 * the plot draws: light and heavy, soluble and not, one risk-free and three
 * that the known-molecule lists flag.
 */
const SAMPLE = [
  'CC(=O)Oc1ccccc1C(=O)O',
  'Cn1cnc2c1c(=O)n(C)c(=O)n2C',
  'CC(=O)Nc1ccc(O)cc1',
  'CC(C)Cc1ccc(cc1)C(C)C(=O)O',
  'CN1CCC[C@H]1c1cccnc1',
].join(',');

/**
 * The empty state of the comparison table.
 * @returns One sentence, and a set to open.
 */
export function CompareEmpty(): ReactElement {
  const href = withBase(`/compare?${toSearch({ smiles: SAMPLE })}`);

  return (
    <NonIdealState
      icon="comparison"
      title="Nothing to compare yet"
      description={
        <span>
          Draw a structure, paste a list of SMILES, or drop an SD file. To see
          what this page does, open{' '}
          <a
            href={href}
            onClick={(event) => {
              if (opensElsewhere(event)) return;
              event.preventDefault();
              setCompareSmiles(SAMPLE);
            }}
          >
            five common drugs
          </a>
          .
        </span>
      }
    />
  );
}

/** Whether a click asked for a new tab or window rather than for this page. */
function opensElsewhere(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}
