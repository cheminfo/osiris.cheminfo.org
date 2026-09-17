/**
 * The two pieces of prose on the explorer: the structures an empty canvas
 * offers, and the paragraph that says where the numbers come from.
 *
 * Both are real addresses, not buttons dressed as links. A reader may open one
 * in a tab of its own, a crawler may follow it, and a course page may copy it —
 * and a plain click stays inside the running page, which is what the History
 * API router is for.
 */

import type { MouseEvent, ReactElement } from 'react';

import { toSearch } from '../../share/query.ts';
import {
  loadExplorerStructure,
  setActiveTab,
  withBase,
} from '../../state/index.ts';

/** What an empty canvas offers, so nobody has to know a notation to start. */
const EXAMPLES = [
  { label: 'benzene', smiles: 'c1ccccc1' },
  { label: 'aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O' },
  { label: 'caffeine', smiles: 'Cn1cnc2c1c(=O)n(C)c(=O)n2C' },
];

/**
 * Three structures to open, under the canvas.
 * @returns The line of example links.
 */
export function ExampleStructures(): ReactElement {
  return (
    <p className="explorer-examples">
      Nothing drawn yet? Open{' '}
      {EXAMPLES.map((example, index) => (
        <span key={example.smiles}>
          {index === 0 ? '' : index === EXAMPLES.length - 1 ? ' or ' : ', '}
          <a
            href={withBase(`/?${toSearch({ smiles: example.smiles })}`)}
            onClick={(event) => {
              if (opensElsewhere(event)) return;
              event.preventDefault();
              loadExplorerStructure({ smiles: example.smiles });
            }}
          >
            {example.label}
          </a>
        </span>
      ))}
      .
    </p>
  );
}

/**
 * Thomas Sander's own first paragraph, and the link to the rest of it.
 *
 * Quoted rather than rewritten: it is what tells a reader that red means a risk
 * of an undesired effect and green means drug-conform behaviour, which is the
 * one thing needed before any of the colours on this page mean anything. The
 * whole description, with its figures and its attribution, is `/method`.
 * @returns The lead paragraph, and where the rest of it lives.
 */
export function MethodLeadIn(): ReactElement {
  return (
    <aside className="explorer-lead">
      <p>
        The OSIRIS Property Explorer lets you draw chemical structures and
        calculates on-the-fly various drug-relevant properties whenever a
        structure is valid. Prediction results are valued and color coded.
        Properties with high risks of undesired effects like mutagenicity or a
        poor intestinal absorption are shown in red. Whereas a green color
        indicates drug-conform behaviour.
      </p>
      <p>
        <a
          href={withBase('/method')}
          onClick={(event) => {
            if (opensElsewhere(event)) return;
            event.preventDefault();
            setActiveTab('method');
          }}
        >
          How the predictions are made
        </a>
      </p>
    </aside>
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
