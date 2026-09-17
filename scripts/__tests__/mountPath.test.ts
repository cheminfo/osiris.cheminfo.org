/**
 * The build survives being mounted under a path.
 *
 * This is the check the family has needed before: an address written from the
 * root of the host works on every deployment but the one that matters, and
 * nothing says so until the day the site is served as one tool among several.
 * So the site is built, laid out under `/osiris/` by the container's own
 * entrypoint, and read back.
 *
 * It drives a real build, which is why it is slower than its neighbours. The
 * alternative — a fixture of what a build looked like once — would pass on the
 * day the build started writing something rooted, which is the only day this
 * test has a job.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { METHOD_FIGURES } from '../../src/method/figures.ts';
import { PAGE_ROUTES } from '../../src/seo/routes.ts';
import { MOUNT_PATH, buildMountedSite } from '../mountedSite.ts';
import {
  findRootedReferences,
  scanForRootedReferences,
  scannableFiles,
} from '../rootedReferences.ts';

test('an address written from the root of the host is a finding', () => {
  const page = [
    '<base href="/osiris/" />',
    '<link rel="icon" href="/favicon.svg" />',
    '<img src="./method/mw.gif" />',
    '<a href="/compare">Compare</a>',
  ].join('\n');

  expect(findRootedReferences(page, 'index.html')).toStrictEqual([
    { file: 'index.html', line: 2, attribute: 'href', value: '/favicon.svg' },
    { file: 'index.html', line: 4, attribute: 'href', value: '/compare' },
  ]);
});

test('a stylesheet naming a font from the root of the host is a finding', () => {
  const sheet = '@font-face {\n  src: url(/assets/icons.woff2);\n}';

  expect(findRootedReferences(sheet, 'assets/index.css')).toStrictEqual([
    {
      file: 'assets/index.css',
      line: 2,
      attribute: 'url()',
      value: '/assets/icons.woff2',
    },
  ]);
});

test('an address that names another host, or this page, is not a finding', () => {
  const page = [
    '<base href="/osiris/" />',
    '<link rel="canonical" href="https://osiris.cheminfo.org/method" />',
    '<meta property="og:image" content="https://osiris.cheminfo.org/og.png" />',
    '<script src="//cdn.example.org/x.js"></script>',
    '<img src="./method/score.gif" />',
    '<a href="compare">Compare</a>',
  ].join('\n');

  expect(findRootedReferences(page, 'method/index.html')).toStrictEqual([]);
});

test(
  'the built site, mounted under a path, writes no address from the root of the host',
  { timeout: 180_000 },
  () => {
    const mounted = buildMountedSite();

    // The mount has to be in the pages, or the scan below would be reading a
    // build nothing was asked of.
    const pages = scannableFiles(mounted).filter((file) =>
      file.endsWith('index.html'),
    );
    expect(pages).toHaveLength(PAGE_ROUTES.length);
    for (const page of pages) {
      const html = readFileSync(join(mounted, page), 'utf8');
      expect(html).toContain(`<base href="${MOUNT_PATH}/" />`);
    }

    // And the figures have to be where the mounted page asks for them.
    for (const figure of METHOD_FIGURES) {
      expect(existsSync(join(mounted, 'method', figure.file))).toBe(true);
    }

    expect(scanForRootedReferences(mounted)).toStrictEqual([]);
  },
);
