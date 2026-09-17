/**
 * The tool's own settings a link carries, and the bounds they are read inside.
 *
 * A shared link is untrusted input, so every one of these is cut to a length
 * the tool can serve: `?smiles=` followed by a megabyte of text is a link
 * nobody wrote by hand, and a list past {@link SHARED_SMILES_LIMIT} molecules
 * does not fit in an address anyway. A value already at its default is deleted
 * rather than written, so an unconfigured link stays a plain link.
 */

import type { ShareParamValues } from 'react-cheminfo/core';
import { parseShareConfig, stringParam } from 'react-cheminfo/core';

import { MAX_STRUCTURE_LENGTH, SHARED_QUERY_LENGTH } from '../state/limits.ts';

import { toSearch } from './query.ts';

/** The longest list of property keys an address may name, in characters. */
const MAX_AXES_LENGTH = 256;

/** The longest single property key an address may name, in characters. */
const MAX_KEY_LENGTH = 40;

/** Every setting a link can pin, keyed by the name it takes in the query. */
export const SHARE_PARAMS = {
  /**
   * The molecule on the explorer, or the whole set on the comparison page,
   * comma or space separated.
   */
  smiles: stringParam({ maxLength: SHARED_QUERY_LENGTH }),
  /** The same molecule as an idCode, which wins when both are given. */
  idcode: stringParam({ maxLength: MAX_STRUCTURE_LENGTH }),
  /** Which properties the plot draws, by key, comma separated. */
  axes: stringParam({ maxLength: MAX_AXES_LENGTH }),
  /** Which property the lines are coloured by. */
  color: stringParam({ maxLength: MAX_KEY_LENGTH }),
  /** The idCode of the row whose properties are shown. */
  focus: stringParam({ maxLength: MAX_STRUCTURE_LENGTH }),
};

/** The codecs of {@link SHARE_PARAMS}. */
export type ShareParams = typeof SHARE_PARAMS;

/** Every setting at the value the link carries, or at its default. */
export type ShareParamSet = ShareParamValues<ShareParams>;

/**
 * Read every setting a link carries.
 * @param query - Decoded query of the address.
 * @returns The settings, each cut to what the tool can serve.
 */
export function readShareParams(
  query: Readonly<Record<string, string>>,
): ShareParamSet {
  return parseShareConfig(toSearch(query), {
    parts: [],
    params: SHARE_PARAMS,
  }).params;
}
