/**
 * A decoded query written back as a query string, for the `react-cheminfo`
 * readers that take one.
 *
 * The family's serializer, never `URLSearchParams`, which writes a space as `+`
 * and reads a `+` back as a space: `CC[N+](C)(C)C` would come out a different
 * molecule, silently, with nothing in the page saying so.
 */

import { formatQueryString } from 'react-cheminfo/core';

/**
 * Write a decoded query back as a query string.
 *
 * A comma stays a comma — a link separating structures with `%2C` is not one a
 * teacher can read out loud — and a parameter carrying nothing is written as
 * its bare key, so a hand-typed `?embed` survives the round trip.
 * @param query - Decoded query of the address.
 * @returns The query string, without its leading `?`.
 */
export function toSearch(query: Readonly<Record<string, string>>): string {
  return formatQueryString(query, { keepEmptyValues: true });
}
