/**
 * Why one risk came back as it did, with the offending substructure located on
 * the molecule.
 *
 * The match runs in the predictor's own mode —
 * `new SSSearcher({ matchAtomCharge: true, matchAromDBondToDelocalized: false })`,
 * which is OpenChemLib's mode 1. The JavaScript default is mode 8, and it can
 * disagree with what `assessRisk` actually found, which would leave a risk
 * reported with nothing highlighted and no way to tell why.
 */

import type * as OCL from 'openchemlib';

import { RISK_TYPE_CODES } from './constants.ts';
import type { OsirisPredictors } from './predictors.ts';
import { parseRiskFindings } from './riskFindings.ts';
import type {
  DetailEntry,
  RiskDetail,
  RiskFinding,
  RiskType,
} from './types.ts';

/**
 * What the predictor found, and where on the molecule it found it.
 * @param molecule - The molecule the risk was assessed on. It is copied before being searched.
 * @param risk - Which of the four risks to explain.
 * @param predictors - OpenChemLib with its resources registered and checked.
 * @returns One finding per sentence the predictor printed, and one per matched fragment.
 */
export function riskDetail(
  molecule: OCL.Molecule,
  risk: RiskType,
  predictors: OsirisPredictors,
): RiskDetail {
  const working = molecule.getCompactCopy();
  const entries = predictors.toxicity.getDetail(
    working,
    RISK_TYPE_CODES[risk],
  ) as readonly DetailEntry[];

  const findings: RiskFinding[] = [];
  for (const finding of parseRiskFindings(entries)) {
    findings.push(
      finding.idCode === null
        ? finding
        : { ...finding, ...locate(working, finding.idCode, predictors) },
    );
  }
  return { risk, findings };
}

interface Match {
  atoms: number[];
  bonds: number[];
}

function locate(
  molecule: OCL.Molecule,
  fragmentIdCode: string,
  predictors: OsirisPredictors,
): Match {
  let fragment: OCL.Molecule;
  try {
    fragment = predictors.Molecule.fromIDCode(fragmentIdCode);
  } catch {
    return { atoms: [], bonds: [] };
  }

  const searcher = new predictors.SSSearcher({
    matchAtomCharge: true,
    matchAromDBondToDelocalized: false,
  });
  searcher.setMol(fragment, molecule);
  if (!searcher.isFragmentInMolecule()) return { atoms: [], bonds: [] };
  searcher.findFragmentInMolecule({ countMode: 'overlapping' });

  const atoms = new Set<number>();
  const bonds = new Set<number>();
  for (const match of searcher.getMatchList()) {
    collect(molecule, fragment, match, atoms, bonds);
  }
  return { atoms: sorted(atoms), bonds: sorted(bonds) };
}

/**
 * Add one match's atoms and bonds to the running sets.
 *
 * A fragment atom the query marked as an exclude group maps to -1, and a bond
 * between two matched atoms may not exist in the molecule when the fragment
 * matched through a bridge, so both are checked rather than assumed.
 */
function collect(
  molecule: OCL.Molecule,
  fragment: OCL.Molecule,
  map: readonly number[],
  atoms: Set<number>,
  bonds: Set<number>,
): void {
  for (const atom of map) {
    if (atom >= 0) atoms.add(atom);
  }
  for (let bond = 0; bond < fragment.getAllBonds(); bond++) {
    const first = map[fragment.getBondAtom(0, bond)];
    const second = map[fragment.getBondAtom(1, bond)];
    if (first === undefined || second === undefined) continue;
    if (first < 0 || second < 0) continue;
    const found = molecule.getBond(first, second);
    if (found !== -1) bonds.add(found);
  }
}

function sorted(values: Set<number>): number[] {
  return Array.from(values).toSorted((a, b) => a - b);
}
