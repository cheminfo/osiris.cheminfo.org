/**
 * Cutting a pasted list into the structures it holds.
 *
 * The separators are the ones the tool this replaces accepted — a newline, a
 * semicolon, a comma or a blank — and a `.smi` file names its structures with
 * whatever follows the first blank on the line. Both cannot be true of the
 * same file, so the file is asked: a sample of its lines is read, and the text
 * after the first blank is a second structure or it is a name.
 */

import { moleculeFromStructure } from './molecule.ts';
import type { InputEntry, SplitResult } from './types.ts';

/**
 * Cut a list of line notations into entries.
 * @param text - The list, as pasted, dropped or carried by a link.
 * @param limit - The most entries to return; past it the split stops.
 * @returns The entries in the order they appear, and whether more were left.
 */
export function splitSmilesList(text: string, limit: number): SplitResult {
  const items = listItems(text);
  const separated = whitespaceSeparates(items);
  const entries: InputEntry[] = [];
  for (const item of items) {
    const structures = separated ? item.text.split(/\s+/) : [item.text];
    for (const piece of structures) {
      if (piece === '') continue;
      if (entries.length === limit) return { entries, truncated: true };
      entries.push(entryOf(item.line, piece, separated));
    }
  }
  return { entries, truncated: false };
}

/** One item of a pasted list, before its name has been taken off it. */
interface ListItem {
  /** 1-based line it was written on. */
  line: number;
  /** The item, trimmed, separators removed. */
  text: string;
}

/** How many items are read before deciding what a blank separates. */
const SAMPLE_SIZE = 20;

function entryOf(line: number, text: string, separated: boolean): InputEntry {
  const blank = separated ? -1 : text.search(/\s/);
  if (blank === -1) return { line, structure: text, label: '' };
  return {
    line,
    structure: text.slice(0, blank),
    label: text.slice(blank).trim(),
  };
}

function listItems(text: string): ListItem[] {
  const items: ListItem[] = [];
  const lines = text.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const line = (lines[index] ?? '').trim();
    if (line === '' || line.startsWith('#')) continue;
    for (const part of line.split(/[;,]+/)) {
      const piece = part.trim();
      if (piece !== '') items.push({ line: index + 1, text: piece });
    }
  }
  return items;
}

/**
 * Whether a blank separates two structures rather than a structure from its
 * name. The text after the first blank is read: `CCO ethanol` names a
 * molecule, `CCO c1ccccc1` holds two. Most of the sample has to read as a
 * structure, so a list the sample cannot decide keeps its names.
 * @param items - The items the list was cut into.
 * @returns True when a blank should be read as a separator.
 */
function whitespaceSeparates(items: readonly ListItem[]): boolean {
  let sampled = 0;
  let structures = 0;
  for (let index = 0; index < items.length && sampled < SAMPLE_SIZE; index++) {
    const text = items[index]?.text ?? '';
    const blank = text.search(/\s/);
    if (blank === -1) continue;
    sampled++;
    if (readsAsStructure(text.slice(blank).trim().split(/\s+/, 1)[0] ?? '')) {
      structures++;
    }
  }
  return sampled > 0 && structures * 2 > sampled;
}

function readsAsStructure(token: string): boolean {
  if (token === '') return false;
  try {
    moleculeFromStructure(token);
    return true;
  } catch {
    return false;
  }
}
