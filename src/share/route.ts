/**
 * The two directions between the view state and the address.
 *
 * A link is the whole configuration of what is on screen: the page, the
 * molecule or the set it is working on, which properties the plot draws, which
 * row is focused, whether the page is framed, and the parts a course page asked
 * to leave out. Both functions are plain state code — no React — so the round
 * trip is unit-tested without a DOM.
 */

import { batch } from '@preact/signals-react';
import { isEmptyIdCode, splitIdCode } from 'react-cheminfo/core';

import {
  loadExplorerStructure,
  setActiveTab,
  setColorBy,
  setCompareSmiles,
  setEmbedded,
  setFocus,
  setHiddenParts,
  setPlotAxes,
  state,
} from '../state/index.ts';
import type { Route } from '../utils/router.ts';

import { EMBED_PARAM, parseEmbed } from './embed.ts';
import { parseHidden, serializeHidden } from './hidden.ts';
import type { ShareParamSet } from './params.ts';
import { SHARE_PARAMS, readShareParams } from './params.ts';
import { HIDE_PARAM } from './parts.ts';

/**
 * Where the state says the visitor is, as a route.
 *
 * Reads signals, so it is meant to be called inside an `effect`: every leaf it
 * touches is a leaf that must rewrite the address when it changes. A setting
 * already at its default is left out, so a plain visit keeps a plain address.
 * @returns The route mirroring the current state.
 */
export function currentRoute(): Route {
  const tab = state.view.activeTab.value;
  const query: Record<string, string> = {};
  if (tab === 'explorer') writeExplorer(query);
  if (tab === 'compare') writeCompare(query);
  if (state.view.embedded.value) query[EMBED_PARAM] = '1';
  const hidden = serializeHidden(state.view.hidden.value);
  if (hidden !== '') query[HIDE_PARAM] = hidden;
  return { tab, query };
}

/**
 * Move the state to a route: the address on load, and every back or forward
 * after it.
 *
 * Everything the address carries has already been cut to length by the share
 * codecs, and a structure that cannot be read is handed to the page rather than
 * rejected here — a bad entry in a list must cost that entry, not the link.
 * @param route - Route to apply.
 */
export function applyRoute(route: Route): void {
  const params = readShareParams(route.query);
  batch(() => {
    setEmbedded(parseEmbed(route.query));
    setHiddenParts(parseHidden(route.query[HIDE_PARAM]));
    setActiveTab(route.tab);
    applyPage(route, params);
  });
}

/**
 * Split a comma-separated list of property keys.
 * @param value - The raw parameter.
 * @returns The keys it names, blanks dropped.
 */
export function parseKeys(value: string): string[] {
  const keys: string[] = [];
  for (const raw of value.split(',')) {
    const key = raw.trim();
    if (key !== '') keys.push(key);
  }
  return keys;
}

function applyPage(route: Route, params: ShareParamSet): void {
  if (route.tab === 'explorer') {
    // The idCode wins when both are given: it is the exact structure, where a
    // SMILES has still to be read and may not come back the same molecule.
    loadExplorerStructure(
      params.idcode === ''
        ? { smiles: params.smiles }
        : { idCode: params.idcode },
    );
    return;
  }
  if (route.tab === 'compare') {
    setCompareSmiles(params.smiles);
    setPlotAxes(parseKeys(params.axes));
    setColorBy(params.color);
    setFocus(params.focus === '' ? null : params.focus);
  }
}

/**
 * The explorer carries its molecule as a SMILES, which is the half of the pair
 * a reader recognises in a link; an idCode goes in only when no SMILES is known
 * yet, and its coordinates are cut — an address names a structure, not a
 * drawing of one.
 */
function writeExplorer(query: Record<string, string>): void {
  const smiles = state.view.explorer.smiles.value;
  if (smiles !== '') {
    writeParam(query, 'smiles', smiles);
    return;
  }
  const { idCode } = splitIdCode(state.view.explorer.idCode.value);
  if (idCode === '' || isEmptyIdCode(idCode)) return;
  writeParam(query, 'idcode', idCode);
}

function writeCompare(query: Record<string, string>): void {
  writeParam(query, 'smiles', state.view.compare.smiles.value);
  writeParam(query, 'axes', state.view.compare.axes.value.join(','));
  writeParam(query, 'color', state.view.compare.colorBy.value);
  writeParam(query, 'focus', state.view.compare.focus.value ?? '');
}

function writeParam(
  query: Record<string, string>,
  key: keyof ShareParamSet,
  value: string,
): void {
  const raw = SHARE_PARAMS[key].serialize(value);
  if (raw !== null) query[key] = raw;
}
