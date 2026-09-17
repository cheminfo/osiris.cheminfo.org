/**
 * What the tool predicts about one molecule, and how a risk is explained.
 *
 * Every quantity OpenChemLib can fail to compute is `number | null` here, never
 * the library's own sentinel: cLogP and solubility answer `-999`, the polar
 * surface area `-1`, drug-likeness `-999` when the tables did not load and `-1`
 * when no fragment matched, and a risk `0`. None of them is `NaN`, and
 * `DrugScoreCalculator` consumes every one of them and returns a plausible
 * number, so a sentinel that leaves this module is a wrong value on screen with
 * nothing to say it is wrong.
 */

/** The four risks OSIRIS assesses, in the order the library numbers them. */
export const RISK_TYPES = [
  'mutagenic',
  'tumorigenic',
  'irritant',
  'reproductive',
] as const;

/** One of the four risks. */
export type RiskType = (typeof RISK_TYPES)[number];

/**
 * How risky one type came back.
 *
 * `unknown` is the library's `RISK_UNKNOWN`, which it returns when its fragment
 * tables did not load — never "nothing was found", which is `none`.
 */
export type RiskLevel = 'unknown' | 'none' | 'low' | 'high';

/** Everything the tool shows for one molecule. */
export interface OsirisProperties {
  /** The canonical idCode, read before anything touched the molecule. */
  idCode: string;
  /** The canonical SMILES, for a link and for a download. */
  smiles: string;
  /** A name from the source, or the SMILES when it carried none. */
  label: string;
  /** e.g. `C6H6`. */
  molecularFormula: string;
  /** The relative molecular weight in g/mol — 78.11 for benzene, never the monoisotopic mass. */
  molecularWeight: number;
  /** cLogP, the octanol/water partition coefficient. */
  logP: number | null;
  /** Aqueous solubility, log10 of mol/L at 25 °C and pH 7.5. */
  logS: number | null;
  /** Topological polar surface area, in Å². */
  polarSurfaceArea: number | null;
  /** Drug-likeness: positive is drug-like, negative is not. */
  druglikeness: number | null;
  /** The drug score, 0 to 1. `null` whenever any of its inputs was unknown. */
  drugScore: number | null;
  /** Every nitrogen and oxygen — the OSIRIS definition, not Lipinski's. */
  acceptorCount: number;
  /** Every nitrogen and oxygen carrying at least one hydrogen. */
  donorCount: number;
  /** Atoms with a real, non-pseudo parity. */
  stereoCenterCount: number;
  /** Single, non-ring, non-terminal, non-amide bonds. */
  rotatableBondCount: number;
  /** How the four risks came back. */
  risks: Record<RiskType, RiskLevel>;
}

/** Which branch of the predictor produced one line of a risk explanation. */
export type RiskFindingKind = 'known' | 'fragment' | 'none' | 'note';

/** One line of why a risk came back as it did. */
export interface RiskFinding {
  /**
   * `known` — the molecule's own idCode is in the RTECS-derived list, so there
   * is nothing to highlight. `fragment` — an alerting substructure matched.
   * `none` — nothing was found. `note` — anything else the predictor printed.
   */
  kind: RiskFindingKind;
  /** The sentence the predictor printed, verbatim. */
  description: string;
  /** How alerting the matched fragment is, or `null` when this is not a fragment. */
  severity: 'high' | 'medium' | null;
  /** The fragment's idCode, or `null` — a known molecule carries no fragment. */
  idCode: string | null;
  /** The molecule's atoms the fragment matched, so the page can highlight them. */
  atoms: readonly number[];
  /** The molecule's bonds the fragment matched. */
  bonds: readonly number[];
}

/** Why one risk came back as it did. */
export interface RiskDetail {
  /** Which of the four risks this explains. */
  risk: RiskType;
  /** What the predictor printed, one entry per sentence or matched fragment. */
  findings: readonly RiskFinding[];
}

/** One entry of a `ParameterizedString[]`, as OpenChemLib hands it over. */
export interface DetailEntry {
  /** 1 is an idCode, 2 is text, 3 is a number written out. */
  type: number;
  /** The entry itself. */
  value: string;
}
