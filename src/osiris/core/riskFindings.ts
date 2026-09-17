/**
 * Reading what the toxicity predictor printed.
 *
 * `getDetail` answers a flat list of typed strings — 1 is an idCode, 2 is text,
 * 3 is a number — in which a text line heads the idCodes that follow it. Which
 * text line it is matters more than anything else the tool shows: "This
 * molecule is known to be mutagenic" means the compound's own idCode is in a
 * list derived from RTECS, and the idCode that follows is **the molecule
 * itself**; "High-risk fragments indicating Mutagenicity" means a substructure
 * matched, and the idCodes that follow are the substructures.
 *
 * Telling them apart is what keeps the red square honest: aspirin, caffeine and
 * paracetamol all come back high through the first branch, and highlighting the
 * whole molecule there would call the compound its own toxicophore.
 */

import type { DetailEntry, RiskFinding } from './types.ts';

/** An idCode, to be drawn as a structure. */
const ID_CODE = 1;
/** Plain text. */
const TEXT = 2;

/**
 * Turn what the predictor printed into the lines a page shows.
 *
 * The matched atoms are left empty here: finding them needs the molecule and
 * the predictor's own match mode, which `riskDetail` supplies.
 * @param entries - What `ToxicityPredictor.getDetail` returned.
 * @returns One finding per sentence, and one per matched fragment.
 */
export function parseRiskFindings(
  entries: readonly DetailEntry[],
): RiskFinding[] {
  const findings: RiskFinding[] = [];
  let heading: Heading = { kind: 'note', description: '', severity: null };

  for (const entry of entries) {
    if (entry.type === TEXT) {
      heading = readHeading(entry.value);
      // A fragment heading says nothing on its own; it is repeated on each of
      // the fragments that follow it, so the page can draw one row per match.
      if (heading.kind !== 'fragment') findings.push(line(heading));
      continue;
    }
    if (entry.type !== ID_CODE) continue;
    // The idCode under a known-molecule heading is the molecule itself.
    if (heading.kind !== 'fragment') continue;
    findings.push({ ...line(heading), idCode: entry.value });
  }

  return findings;
}

interface Heading {
  kind: RiskFinding['kind'];
  description: string;
  severity: RiskFinding['severity'];
}

function line(heading: Heading): RiskFinding {
  return {
    kind: heading.kind,
    description: heading.description,
    severity: heading.severity,
    idCode: null,
    atoms: [],
    bonds: [],
  };
}

/** `This molecule is known to be mutagenic:` and its three siblings. */
const KNOWN = /^This molecule is known to be /i;
const HIGH_RISK = /^High-risk fragments/i;
const MEDIUM_RISK = /^Medium-risk fragments/i;
const NOTHING_FOUND = /^No indication for /i;

function readHeading(value: string): Heading {
  if (KNOWN.test(value)) {
    return { kind: 'known', description: value, severity: null };
  }
  if (HIGH_RISK.test(value)) {
    return { kind: 'fragment', description: value, severity: 'high' };
  }
  if (MEDIUM_RISK.test(value)) {
    return { kind: 'fragment', description: value, severity: 'medium' };
  }
  if (NOTHING_FOUND.test(value)) {
    return { kind: 'none', description: value, severity: null };
  }
  return { kind: 'note', description: value, severity: null };
}
