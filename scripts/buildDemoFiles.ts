/**
 * Write `public/demo`, the two files a visitor opens when they have none of
 * their own.
 *
 * Run with `npm run demo-files`. They are generated rather than hand-written
 * for the same reason the card is: a molfile carries coordinates for every
 * atom, so twenty-six of them typed by hand would be twenty-six chances to
 * ship a structure that is not the molecule it is named after. Here each one
 * is parsed from its SMILES by the same library that predicts it, and a
 * structure that does not read stops the run rather than reaching `public`.
 *
 * The two files are deliberately different shapes: an SD file that names its
 * records in a field, and a list that names them after a blank. Between them
 * they exercise both halves of the reader, which is what makes them worth
 * shipping as well as worth opening.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Molecule } from 'openchemlib';

/** One structure of a demo file, as it is written down here. */
interface DemoStructure {
  /** What the file calls it, and what the table shows. */
  name: string;
  /** The structure, in SMILES. */
  smiles: string;
}

/**
 * Twenty-six drugs on the market, which is the set the OSIRIS models were
 * fitted against — so the properties land where `/method` says they should,
 * and the four risk columns are neither all clear nor all red.
 */
const TRADED_DRUGS: readonly DemoStructure[] = [
  { name: 'aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O' },
  { name: 'salicylic acid', smiles: 'OC(=O)c1ccccc1O' },
  { name: 'paracetamol', smiles: 'CC(=O)Nc1ccc(O)cc1' },
  { name: 'ibuprofen', smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O' },
  { name: 'naproxen', smiles: 'COc1ccc2cc(ccc2c1)C(C)C(=O)O' },
  { name: 'ketoprofen', smiles: 'CC(C(=O)O)c1cccc(c1)C(=O)c1ccccc1' },
  { name: 'diclofenac', smiles: 'OC(=O)Cc1ccccc1Nc1c(Cl)cccc1Cl' },
  { name: 'caffeine', smiles: 'Cn1cnc2c1c(=O)n(C)c(=O)n2C' },
  { name: 'theophylline', smiles: 'Cn1c(=O)c2[nH]cnc2n(C)c1=O' },
  { name: 'nicotine', smiles: 'CN1CCC[C@H]1c1cccnc1' },
  { name: 'ephedrine', smiles: 'CN[C@@H](C)[C@H](O)c1ccccc1' },
  {
    name: 'morphine',
    smiles: 'CN1CC[C@]23c4c5ccc(O)c4O[C@H]2[C@@H](O)C=C[C@H]3[C@H]1C5',
  },
  { name: 'diazepam', smiles: 'CN1c2ccc(Cl)cc2C(=NCC1=O)c1ccccc1' },
  { name: 'lidocaine', smiles: 'CCN(CC)CC(=O)Nc1c(C)cccc1C' },
  { name: 'propranolol', smiles: 'CC(C)NCC(O)COc1cccc2ccccc12' },
  { name: 'atenolol', smiles: 'CC(C)NCC(O)COc1ccc(CC(N)=O)cc1' },
  { name: 'metformin', smiles: 'CN(C)C(=N)NC(=N)N' },
  { name: 'warfarin', smiles: 'CC(=O)CC(c1ccccc1)c1c(O)c2ccccc2oc1=O' },
  { name: 'furosemide', smiles: 'NS(=O)(=O)c1cc(C(=O)O)c(NCc2ccco2)cc1Cl' },
  { name: 'chloroquine', smiles: 'CCN(CC)CCCC(C)Nc1ccnc2cc(Cl)ccc12' },
  {
    name: 'benzylpenicillin',
    smiles: 'CC1(C)S[C@@H]2[C@H](NC(=O)Cc3ccccc3)C(=O)N2[C@H]1C(=O)O',
  },
  {
    name: 'amoxicillin',
    smiles: 'CC1(C)S[C@@H]2[C@H](NC(=O)[C@H](N)c3ccc(O)cc3)C(=O)N2[C@H]1C(=O)O',
  },
  {
    name: 'omeprazole',
    smiles: 'COc1ccc2[nH]c(nc2c1)S(=O)Cc1ncc(C)c(OC)c1C',
  },
  {
    name: 'sildenafil',
    smiles: 'CCCc1nn(C)c2c1nc([nH]c2=O)-c1cc(ccc1OCC)S(=O)(=O)N1CCN(C)CC1',
  },
  { name: 'thalidomide', smiles: 'O=C1CCC(N2C(=O)c3ccccc3C2=O)C(=O)N1' },
  { name: 'ascorbic acid', smiles: 'OC[C@H](O)[C@H]1OC(=O)C(O)=C1O' },
];

/**
 * Thirty-four solvents off a bench, which is the other half of the picture:
 * small, mostly not drug-like, and several of them flagged — benzene,
 * chloroform, tetrachloromethane, aniline — so the risk columns say something
 * a chemist can check against what they already know.
 */
const SOLVENTS: readonly DemoStructure[] = [
  { name: 'water', smiles: 'O' },
  { name: 'methanol', smiles: 'CO' },
  { name: 'ethanol', smiles: 'CCO' },
  { name: 'propan-2-ol', smiles: 'CC(C)O' },
  { name: 'butan-1-ol', smiles: 'CCCCO' },
  { name: 'ethylene glycol', smiles: 'OCCO' },
  { name: 'glycerol', smiles: 'OCC(O)CO' },
  { name: 'acetone', smiles: 'CC(C)=O' },
  { name: 'butanone', smiles: 'CCC(C)=O' },
  { name: 'acetonitrile', smiles: 'CC#N' },
  { name: 'dimethyl sulfoxide', smiles: 'CS(C)=O' },
  { name: 'dimethylformamide', smiles: 'CN(C)C=O' },
  { name: 'N-methylpyrrolidone', smiles: 'CN1CCCC1=O' },
  { name: 'formamide', smiles: 'NC=O' },
  { name: 'tetrahydrofuran', smiles: 'C1CCOC1' },
  { name: 'dioxane', smiles: 'C1COCCO1' },
  { name: 'diethyl ether', smiles: 'CCOCC' },
  { name: 'ethyl acetate', smiles: 'CCOC(C)=O' },
  { name: 'acetic acid', smiles: 'CC(=O)O' },
  { name: 'formic acid', smiles: 'OC=O' },
  { name: 'dichloromethane', smiles: 'ClCCl' },
  { name: 'chloroform', smiles: 'ClC(Cl)Cl' },
  { name: 'tetrachloromethane', smiles: 'ClC(Cl)(Cl)Cl' },
  { name: 'hexane', smiles: 'CCCCCC' },
  { name: 'cyclohexane', smiles: 'C1CCCCC1' },
  { name: 'benzene', smiles: 'c1ccccc1' },
  { name: 'toluene', smiles: 'Cc1ccccc1' },
  { name: 'o-xylene', smiles: 'Cc1ccccc1C' },
  { name: 'pyridine', smiles: 'c1ccncc1' },
  { name: 'aniline', smiles: 'Nc1ccccc1' },
  { name: 'phenol', smiles: 'Oc1ccccc1' },
  { name: 'nitromethane', smiles: 'C[N+](=O)[O-]' },
  { name: 'carbon disulfide', smiles: 'S=C=S' },
  { name: 'triethylamine', smiles: 'CCN(CC)CC' },
];

const DIRECTORY = join(import.meta.dirname, '..', 'public', 'demo');
mkdirSync(DIRECTORY, { recursive: true });

write('traded-drugs.sdf', sdFile(TRADED_DRUGS));
write(
  'solvents.smi',
  smilesList(SOLVENTS, 'Common laboratory solvents, from osiris.cheminfo.org.'),
);

/**
 * An SD file, each record named twice: in its title line, and in the `NAME`
 * field the reader prefers. Both are what a file off an instrument or a
 * catalogue carries, and the tool reads either.
 * @param structures - The structures, in the order they are written.
 * @returns The file.
 */
function sdFile(structures: readonly DemoStructure[]): string {
  const records: string[] = [];
  for (const structure of structures) {
    const molecule = Molecule.fromSmiles(structure.smiles);
    molecule.setName(structure.name);
    records.push(
      `${molecule.toMolfile().trimEnd()}\n>  <NAME>\n${structure.name}\n\n$$$$\n`,
    );
  }
  return records.join('');
}

/**
 * A list, one structure per line with its name after a blank — the shape the
 * paste box documents, so the same file reads whether it is opened or its
 * contents are pasted.
 * @param structures - The structures, in the order they are written.
 * @param heading - The comment the file opens with; the reader skips it.
 * @returns The file.
 */
function smilesList(
  structures: readonly DemoStructure[],
  heading: string,
): string {
  const lines = [`# ${heading}`];
  for (const structure of structures) {
    // Parsed and written back, so a structure that does not read fails here
    // rather than in somebody's browser.
    Molecule.fromSmiles(structure.smiles);
    if (/[,;]/.test(structure.name)) {
      // A comma separates two structures in a list, so a name carrying one
      // would be read as a second structure and fail: `ethane-1,2-diol` is
      // written `ethylene glycol` for that reason and no other.
      throw new Error(`${structure.name} holds a separator`);
    }
    lines.push(`${structure.smiles} ${structure.name}`);
  }
  return `${lines.join('\n')}\n`;
}

function write(file: string, contents: string): void {
  const target = join(DIRECTORY, file);
  writeFileSync(target, contents);
  process.stdout.write(`${target} written (${contents.length} bytes)\n`);
}
