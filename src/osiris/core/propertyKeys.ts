/**
 * Which of a molecule's predicted numbers the tool shows, and in which order.
 *
 * The order is the legacy panel's, top to bottom, and it is the same order the
 * comparison table's columns and the plot's default axes take: a reader who
 * learned the panel reads the table without relearning it. The keys are the
 * field names of {@link OsirisProperties}, so an address carrying
 * `axes=logP,logS` names the same things the panel does.
 */

import type { OsirisProperties } from './types.ts';

/** The ten numbers the tool shows, in the order it shows them. */
export const PROPERTY_KEYS = [
  'logP',
  'logS',
  'molecularWeight',
  'polarSurfaceArea',
  'druglikeness',
  'acceptorCount',
  'donorCount',
  'stereoCenterCount',
  'rotatableBondCount',
  'drugScore',
] as const;

/** One of the ten displayed properties. */
export type PropertyKey = (typeof PROPERTY_KEYS)[number];

/**
 * Whether a string names a displayed property, so an address that carries
 * something else is ignored rather than plotted as a blank axis.
 * @param value - Whatever the address or the reader supplied.
 * @returns True when it is one of the ten.
 */
export function isPropertyKey(value: string): value is PropertyKey {
  return (PROPERTY_KEYS as readonly string[]).includes(value);
}

/**
 * One property of one molecule.
 *
 * `null` means the predictor could not answer — never zero, and never the
 * library's own sentinel, both of which plot and sort as real values.
 * @param properties - What was predicted for the molecule.
 * @param key - Which of the ten to read.
 * @returns The number, or `null` when it is unknown.
 */
export function propertyValue(
  properties: OsirisProperties,
  key: PropertyKey,
): number | null {
  return properties[key];
}
