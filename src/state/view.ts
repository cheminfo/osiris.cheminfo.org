/**
 * Ephemeral cross-component UI state: which page is open, what the explorer is
 * drawing, and how the comparison is being read.
 *
 * Session-only. Everything here is mirrored into the address by
 * `src/share/route.ts`, so a link reproduces exactly what is on screen. What
 * survives a reload — the set itself, the colour scale — lives in
 * `preferences`.
 */

import { signal } from '@preact/signals-react';

import type { SharePartId } from '../share/parts.ts';

import type { TabId } from './tabs.ts';
import { DEFAULT_TAB } from './tabs.ts';

/** The `view` bucket: plain object, signal leaves, never reassigned. */
export const view = {
  activeTab: signal<TabId>(DEFAULT_TAB),
  explorer: {
    /**
     * What the editor holds, as `idCode` and its coordinates after a space.
     * Empty while only a SMILES is known — an address named one and nothing has
     * read it into the editor yet.
     */
    idCode: signal(''),
    /**
     * The canonical SMILES of the same structure, which is what a link carries
     * because it is the half of the pair a reader can recognise.
     */
    smiles: signal(''),
    /**
     * Bumped whenever something other than the pen changed the structure, so
     * the uncontrolled editor reloads its `value` exactly then and never
     * resets the coordinates under a hand that is drawing.
     */
    revision: signal(0),
    /** Which risk has its offending fragment open, by risk type, or `null`. */
    openRisk: signal<string | null>(null),
  },
  compare: {
    /** The properties the plot draws, by key, in axis order. */
    axes: signal<readonly string[]>([]),
    /** The property the lines are coloured by, by key. */
    colorBy: signal(''),
    /** The row the property panel is showing, by its idCode, or `null`. */
    focus: signal<string | null>(null),
    /**
     * The set as an address carries it, comma separated. The page owns it in
     * both directions: it reads this on load, and writes it back whenever the
     * set changes, so the link and the table never disagree.
     */
    smiles: signal(''),
  },
  /**
   * Regions the link asks the page to leave out, from `?hide=`. How the page is
   * being shown, not what the reader did, so it is never persisted — an
   * embedded frame states it on every load.
   */
  hidden: signal<readonly SharePartId[]>([]),
  /**
   * Whether the link frames the page, from `?embed`: no header, no bar, no
   * footer. Never persisted, for the same reason as {@link view.hidden}.
   */
  embedded: signal(false),
};

/**
 * Open a page.
 * @param tab - Page to show.
 */
export function setActiveTab(tab: TabId): void {
  view.activeTab.value = tab;
}

/**
 * Record what the pen just drew.
 *
 * The revision is deliberately not bumped: the editor is where this came from,
 * and reloading it would reset the coordinates mid-stroke.
 * @param structure - The idCode with its coordinates and the canonical SMILES,
 * both of which one `StructureEditorChange` carries.
 */
export function setDrawnStructure(structure: {
  idCode: string;
  smiles: string;
}): void {
  view.explorer.idCode.value = structure.idCode;
  view.explorer.smiles.value = structure.smiles;
  view.explorer.openRisk.value = null;
}

/**
 * Put a structure on the explorer from somewhere other than the pen — an
 * address, an example link, a row of the comparison table.
 * @param structure - The idCode to load, and the SMILES to read when there is
 * no idCode. Both empty empties the editor.
 */
export function loadExplorerStructure(structure: {
  idCode?: string;
  smiles?: string;
}): void {
  view.explorer.idCode.value = structure.idCode ?? '';
  view.explorer.smiles.value = structure.smiles ?? '';
  view.explorer.openRisk.value = null;
  view.explorer.revision.value += 1;
}

/**
 * Open the fragment responsible for one risk, or close it.
 * @param risk - Risk type, or `null` to close what is open.
 */
export function openRiskDetail(risk: string | null): void {
  view.explorer.openRisk.value = risk;
}

/**
 * Draw the plot over another set of properties.
 * @param axes - Property keys, in the order the axes stand.
 */
export function setPlotAxes(axes: readonly string[]): void {
  view.compare.axes.value = axes;
}

/**
 * Colour the lines by another property.
 * @param key - Property key, or an empty string for the plot's own default.
 */
export function setColorBy(key: string): void {
  view.compare.colorBy.value = key;
}

/**
 * Show one row's properties, and highlight its line.
 * @param idCode - The row's idCode, or `null` to focus none.
 */
export function setFocus(idCode: string | null): void {
  view.compare.focus.value = idCode;
}

/**
 * Hand the comparison page the structures an address named.
 * @param smiles - The list, as the address carried it.
 */
export function setCompareSmiles(smiles: string): void {
  view.compare.smiles.value = smiles;
}

/**
 * Leave out the parts a shared link named.
 * @param parts - Regions to drop; an empty list shows the whole page.
 */
export function setHiddenParts(parts: readonly SharePartId[]): void {
  view.hidden.value = parts;
}

/**
 * Frame the page without its chrome, or give the chrome back.
 * @param embedded - True to drop the header and the footer.
 */
export function setEmbedded(embedded: boolean): void {
  view.embedded.value = embedded;
}
