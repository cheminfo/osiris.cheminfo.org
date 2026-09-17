/**
 * The files a visitor can open when they have none of their own.
 *
 * A drop zone asks for something the reader is not carrying: a chemist trying
 * the tool for the first time has a structure in mind long before they have an
 * SD file to hand. So two are shipped with the site, at addresses of their own
 * — a plain left click reads one into the page, and any other click leaves the
 * browser to fetch the file itself, which is how somebody gets a small example
 * of each format to write their own against.
 *
 * Nothing is imported here but the mount, for the reason `acceptedFiles.ts`
 * imports nothing at all: a page needs this list to render its links, and
 * reaching it through `./index.ts` would put OpenChemLib in the chunk that
 * draws the page. The files are written by `npm run demo-files`.
 */

import { withBase } from '../state/site.ts';

/** One file shipped with the site for a reader to open. */
export interface DemoFile {
  /** The file name, under `public/demo`. */
  file: string;
  /** What the link says, the count included. */
  label: string;
  /** The format, as the link names it in passing. */
  kind: string;
  /** How many structures it holds. */
  count: number;
}

/**
 * Where the demo files are served from, under the site's own root.
 * `public/demo` at build time, `demo/` under whatever this deployment is
 * mounted at.
 */
export const DEMO_FILE_DIRECTORY = 'demo/';

/**
 * The two files, in the order the links offer them: the drugs first, because a
 * set the models were fitted against is what the numbers are worth reading on.
 */
export const DEMO_FILES: readonly DemoFile[] = [
  {
    file: 'traded-drugs.sdf',
    label: '26 traded drugs',
    kind: 'SD file',
    count: 26,
  },
  {
    file: 'solvents.smi',
    label: '34 solvents',
    kind: 'SMILES list',
    count: 34,
  },
];

/**
 * Where a demo file is fetched from, mount path included.
 * @param demo - One of {@link DEMO_FILES}.
 * @returns The address, from the browser's point of view.
 */
export function demoFileUrl(demo: DemoFile): string {
  return withBase(`${DEMO_FILE_DIRECTORY}${demo.file}`);
}
