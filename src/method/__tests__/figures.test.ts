/**
 * The nine figures of the method document: that the renderer and the document
 * name the same ones, that each is actually shipped, and that the address a
 * figure is fetched from carries the mount path.
 *
 * The document is somebody else's, carried verbatim, so nothing rewrites its
 * `src` attributes. What keeps them working is this table — which means the
 * table and the document have to be read against each other, or a figure the
 * author added would silently not render.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import {
  METHOD_FIGURES,
  METHOD_FIGURE_DIRECTORY,
  resolveMethodFigure,
} from '../figures.ts';

const PUBLIC_METHOD = join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  'public',
  'method',
);

const DOCUMENT = readFileSync(
  join(import.meta.dirname, '..', '..', 'data', 'method.md'),
  'utf8',
);

test('a figure resolves to an address under the mount, never from the root', () => {
  const figure = resolveMethodFigure('toxicity.gif');

  expect(figure).toStrictEqual({
    file: 'toxicity.gif',
    alt: 'Toxicity risk assessment: predicted risk over four RTECS subsets, beside a control set of traded drugs.',
    width: 522,
    height: 454,
    url: '/method/toxicity.gif',
  });
});

test('nothing but the nine figures the document ships resolves', () => {
  expect(resolveMethodFigure(undefined)).toBeNull();
  expect(resolveMethodFigure('')).toBeNull();
  expect(resolveMethodFigure('/method/toxicity.gif')).toBeNull();
  expect(resolveMethodFigure('../method/toxicity.gif')).toBeNull();
  expect(resolveMethodFigure('https://example.org/toxicity.gif')).toBeNull();
  expect(resolveMethodFigure('nothing.gif')).toBeNull();
});

test('the document and the table name the same figures, in the same order', () => {
  const written: string[] = [];
  for (const match of DOCUMENT.matchAll(/<img[^>]*\bsrc="(?<src>[^"]*)"/g)) {
    written.push(match.groups?.src ?? '');
  }

  expect(written).toStrictEqual(METHOD_FIGURES.map((figure) => figure.file));
});

test('every figure is shipped, at the size the table records', () => {
  expect(METHOD_FIGURE_DIRECTORY).toBe('method/');
  for (const figure of METHOD_FIGURES) {
    const path = join(PUBLIC_METHOD, figure.file);
    expect(existsSync(path), figure.file).toBe(true);
    // A GIF header carries its own size at bytes 6..9, little-endian, which is
    // what the browser reserves room with before the file has arrived.
    const header = readFileSync(path);
    expect(header.toString('latin1', 0, 3), figure.file).toBe('GIF');
    expect([header.readUInt16LE(6), header.readUInt16LE(8)]).toStrictEqual([
      figure.width,
      figure.height,
    ]);
  }
});

test('every figure is named for the reader who cannot see it', () => {
  for (const figure of METHOD_FIGURES) {
    expect(figure.alt.length, figure.file).toBeGreaterThan(30);
    expect(figure.alt.endsWith('.'), figure.file).toBe(true);
    // The heading it sits under, then what it shows.
    expect(figure.alt).toContain(': ');
  }
});
