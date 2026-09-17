/**
 * The line of links under the list card: the two files the site ships, for a
 * reader who has none of their own.
 *
 * A drop zone asks for something the reader is not carrying. A chemist trying
 * the tool has a structure in mind long before they have an SD file to hand,
 * and a set of twenty-six is what shows in one click what the table and the
 * figure are for — which no sentence about them does.
 *
 * Each link is the file's own address, so a plain click reads it into the page
 * and any other — a ⌘-click, a middle click, a right-click and Save — leaves
 * the browser to fetch the file itself. That is how somebody gets a small
 * example of either format to write their own against.
 */

import type { ReactElement } from 'react';
import { Fragment } from 'react';

import { DEMO_FILES, demoFileUrl } from '../../input/demoFiles.ts';
import { opensElsewhere } from '../../utils/inPageLink.ts';

import type { CompareSet } from './useCompareSet.ts';

/** What {@link CompareDemoLinks} needs. */
export interface CompareDemoLinksProps {
  /** The set to add to. */
  set: CompareSet;
}

/**
 * The demo files, as one line of links.
 * @param props - See {@link CompareDemoLinksProps}.
 * @returns The links.
 */
export function CompareDemoLinks(props: CompareDemoLinksProps): ReactElement {
  const { set } = props;

  return (
    <p className="panel-note">
      Or open a demo:{' '}
      {DEMO_FILES.map((demo, index) => (
        <Fragment key={demo.file}>
          {index === 0 ? null : ', '}
          <a
            href={demoFileUrl(demo)}
            onClick={(event) => {
              if (opensElsewhere(event)) return;
              event.preventDefault();
              set.addDemo(demo);
            }}
          >
            {demo.label}
          </a>{' '}
          ({demo.kind})
        </Fragment>
      ))}
      .
    </p>
  );
}
