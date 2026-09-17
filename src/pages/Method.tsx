/**
 * `/method` — where each predicted number comes from, in its author's words.
 *
 * The text and the nine figures are Thomas Sander's description of the OSIRIS
 * Property Explorer. The legacy tool framed them from a page of its own; this
 * site carries them, because a tool whose method is an iframe loses its method
 * the day that host moves. The words are the author's: the Markdown is his,
 * verbatim but for seventeen plain spelling slips, and it is prettier-ignored
 * so nothing reformats it on its way through.
 *
 * Raw HTML survives the render because the source needs it — nine `<img>` and
 * the `<sub>` of `c_octanol / c_water` — and is sanitised on the way, since raw
 * HTML from a document is raw HTML whoever wrote it.
 *
 * Every figure's address is built by {@link resolveMethodFigure}: the `src`
 * attributes in the source stay as their author wrote them, and the mount path
 * this deployment answers under is added here, once.
 *
 * The page declares no hideable part — `TAB_PARTS.method` is empty — because
 * there is nothing on it a link would want to keep and drop separately. `?embed`
 * still drops the header and the footer, which the shell does for every page.
 */

import { Card } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

import source from '../data/method.md?raw';
import { resolveMethodFigure } from '../method/figures.ts';

/** Where the text and the figures were published, and still are. */
const ORIGINAL_PAGE =
  'https://cheminfo.github.io/www.c6h6.org/molecules/propertyExplorer/';

/** The repository this copy was taken from. */
const SOURCE_REPOSITORY = 'https://github.com/cheminfo/www.c6h6.org';

/**
 * The method page.
 * @returns Thomas Sander's description of the predictions, with its figures.
 */
export function Method(): ReactElement {
  return (
    <Card className="panel prose method-page">
      <p className="method-attribution">
        Thomas Sander wrote this description of the OSIRIS Property Explorer at
        Actelion Pharmaceuticals Ltd. (now Idorsia), Allschwil, Switzerland. The
        text and the figures are his, copied from{' '}
        <a href={ORIGINAL_PAGE} target="_blank" rel="noopener noreferrer">
          the original page
        </a>{' '}
        and its repository,{' '}
        <a href={SOURCE_REPOSITORY} target="_blank" rel="noopener noreferrer">
          cheminfo/www.c6h6.org
        </a>
        .
      </p>

      <Markdown
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          img({ src }) {
            const figure = resolveMethodFigure(
              typeof src === 'string' ? src : undefined,
            );
            if (figure === null) return null;
            return (
              <img
                className="method-figure"
                src={figure.url}
                alt={figure.alt}
                width={figure.width}
                height={figure.height}
                loading="lazy"
              />
            );
          },
        }}
      >
        {source}
      </Markdown>
    </Card>
  );
}
