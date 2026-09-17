/**
 * How strongly the figure's lines are drawn.
 *
 * The shared figure's own default suits a library of thousands, where the lines
 * are read as a density rather than followed one by one. Five molecules drawn
 * at that strength are barely there, so a small set is drawn solidly and the
 * fade only starts once the lines begin to pile up.
 */

/** How solidly a line is drawn at the smallest sets, and at the largest. */
const STRONGEST_LINE = 0.9;
const FAINTEST_LINE = 0.35;

/** Where the fade starts: about this many lines read as a mass rather than as lines. */
const MASS = 60;

/**
 * How strongly one line is drawn, given how many there are.
 * @param count - How many molecules are drawn.
 * @returns The alpha a kept line takes.
 */
export function lineAlpha(count: number): number {
  if (count <= 0) return STRONGEST_LINE;
  return Math.min(STRONGEST_LINE, Math.max(FAINTEST_LINE, MASS / count));
}
