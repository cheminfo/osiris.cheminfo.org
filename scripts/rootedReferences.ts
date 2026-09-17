/**
 * Every address in a built page that starts at the root of the host.
 *
 * This site is served at `https://osiris.cheminfo.org/` and, from the same
 * image, under a path of a shared host — and it is framed in other people's
 * pages. So an address written from the root of whatever host answered is a
 * bug: `/method/toxicity.gif` is the right address for exactly one of those
 * deployments and a 404 for the others. Everything the markup names is written
 * relative, and the `<base>` the container stamps in at startup resolves it;
 * everything the page builds while it runs goes through `withBase()`.
 *
 * That rule is invisible until the day the site is mounted somewhere other
 * than the root, which is why it is read back off the build rather than
 * trusted. What is scanned is the markup and the stylesheets — the addresses
 * the build itself wrote. The addresses the running page computes are checked
 * where they can be: `e2e/mounted.spec.ts` loads the mounted build and asserts
 * nothing it fetched answered 404.
 *
 * Two kinds of address are deliberately absolute and are not findings: a full
 * `https://…` one, which names where the site is published — the canonical
 * link, `og:url`, the sitemap — and the one `<base href>` the whole scheme
 * rests on.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

/** One address written from the root of the host, and where it was found. */
export interface RootedReference {
  /** The file it is in, relative to the directory scanned. */
  file: string;
  /** The 1-based line it is on. */
  line: number;
  /** What names it: an attribute, or `url()` in a stylesheet. */
  attribute: string;
  /** The address as written. */
  value: string;
}

/** The file types whose addresses the build itself wrote. */
const SCANNED_EXTENSIONS = new Set(['.html', '.css', '.svg']);

/**
 * The `<base>` element, which is the one address allowed to start at the root:
 * it is what says where the site is mounted, so every other address in the page
 * can be relative to it.
 */
const BASE_ELEMENT = /<base\b[^>]*>/gi;

/**
 * An attribute naming an address: `src="/assets/index.js"`. A value opening
 * with two slashes is protocol-relative and names another host, not this one.
 */
const ROOTED_ATTRIBUTE =
  /\b(?<attribute>src|href|srcset|poster|action|data|content|xlink:href)\s*=\s*(?<quote>["'])(?<value>\/(?!\/)[^"']*)\k<quote>/gi;

/** A stylesheet's own way of naming one: `url(/fonts/icons.woff2)`. */
const ROOTED_CSS_URL =
  /url\(\s*(?<quote>["']?)(?<value>\/(?!\/)[^"')]*)\k<quote>\s*\)/gi;

/**
 * Every root-rooted address a built file names.
 * @param text - The file's contents.
 * @param file - What to call it in a finding.
 * @returns One entry per address, in the order they appear. Empty is a pass.
 */
export function findRootedReferences(
  text: string,
  file: string,
): RootedReference[] {
  // Blanked rather than removed so every offset below still points at the line
  // it came from.
  const scannable = text.replaceAll(BASE_ELEMENT, (element) =>
    ' '.repeat(element.length),
  );
  const found: RootedReference[] = [];
  for (const match of scannable.matchAll(ROOTED_ATTRIBUTE)) {
    found.push({
      file,
      line: lineAt(scannable, match.index),
      attribute: (match.groups?.attribute ?? '').toLowerCase(),
      value: match.groups?.value ?? '',
    });
  }
  for (const match of scannable.matchAll(ROOTED_CSS_URL)) {
    found.push({
      file,
      line: lineAt(scannable, match.index),
      attribute: 'url()',
      value: match.groups?.value ?? '',
    });
  }
  found.sort((a, b) => a.line - b.line);
  return found;
}

/**
 * Every root-rooted address in a built site.
 * @param directory - The built site, e.g. `dist-mount`.
 * @returns One entry per address, file by file. Empty is a pass.
 */
export function scanForRootedReferences(directory: string): RootedReference[] {
  const found: RootedReference[] = [];
  for (const file of scannableFiles(directory)) {
    const text = readFileSync(join(directory, file), 'utf8');
    found.push(...findRootedReferences(text, file));
  }
  return found;
}

/**
 * The files of a built site whose addresses the build wrote.
 * @param directory - The built site.
 * @returns Their paths, relative to `directory`, in a stable order.
 */
export function scannableFiles(directory: string): string[] {
  const files: string[] = [];
  collect(directory, directory, files);
  files.sort();
  return files;
}

/**
 * Append every scannable file under `current` to `files`.
 * @param root - The directory the returned paths are relative to.
 * @param current - The directory being walked.
 * @param files - Where the paths are appended.
 */
function collect(root: string, current: string, files: string[]): void {
  for (const entry of readdirSync(current)) {
    const path = join(current, entry);
    if (statSync(path).isDirectory()) {
      collect(root, path, files);
    } else if (SCANNED_EXTENSIONS.has(extname(entry).toLowerCase())) {
      files.push(relative(root, path));
    }
  }
}

/**
 * The line a character offset falls on.
 * @param text - The text the offset is into.
 * @param index - The offset.
 * @returns The 1-based line number.
 */
function lineAt(text: string, index: number): number {
  let line = 1;
  for (let position = 0; position < index; position++) {
    if (text.codePointAt(position) === 10) line++;
  }
  return line;
}
