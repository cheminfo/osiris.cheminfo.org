/**
 * Cutting an address into the pieces the router reads.
 *
 * The query itself is `react-cheminfo`'s: it keeps a `+` literal — which is
 * what stops `CC[N+](C)(C)C` becoming another molecule — writes a bare key back
 * as a bare key, and leaves a comma unescaped, because a `hide` list escaped to
 * `%2C` is a link nobody can read out loud. What is left here is the two cuts
 * nobody else makes.
 */

/**
 * Cut an address at its `?`, tolerating a leading `#`.
 * @param address - Path and query together.
 * @returns The two halves, the `?` itself dropped.
 */
export function splitQuery(address: string): { path: string; search: string } {
  const withoutHash = address.startsWith('#') ? address.slice(1) : address;
  const index = withoutHash.indexOf('?');
  if (index === -1) return { path: withoutHash, search: '' };
  return {
    path: withoutHash.slice(0, index),
    search: withoutHash.slice(index + 1),
  };
}

/**
 * Split a path into its decoded, non-empty segments.
 * @param path - The path half of an address.
 * @returns Its segments, decoded.
 */
export function splitPath(path: string): string[] {
  const segments: string[] = [];
  for (const raw of path.split('/')) {
    if (raw === '') continue;
    segments.push(decodeSegment(raw));
  }
  return segments;
}

/** `decodeURIComponent` throws on a lone `%`; an address is hand-editable. */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
