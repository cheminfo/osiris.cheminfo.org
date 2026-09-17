import { Molecule } from 'openchemlib';
import { expect, test } from 'vitest';

import {
  NO_ATOMS_MESSAGE,
  QUERY_MESSAGE,
  UNREADABLE_MESSAGE,
  readableError,
} from '../errors.ts';
import {
  describeMolecule,
  moleculeFromIdCode,
  moleculeFromStructure,
} from '../molecule.ts';

test('a parser message is cleaned of the class that raised it', () => {
  const error = new Error(
    'Class$S19: SmilesParser: dangling ring closure: 1; position:7',
  );
  expect(readableError(error)).toBe('Dangling ring closure: 1');
});

test('a crash inside the generated code gets the floor message', () => {
  const error = new TypeError(
    "Cannot read properties of undefined (reading 'd')",
  );
  expect(readableError(error)).toBe(UNREADABLE_MESSAGE);
});

test('something thrown that is not an error gets the floor message', () => {
  expect(readableError('boom')).toBe(UNREADABLE_MESSAGE);
});

test('an empty structure holds no atom', () => {
  expect(() => moleculeFromStructure(' ')).toThrow(NO_ATOMS_MESSAGE);
});

test('a molfile declaring no atom holds no atom', () => {
  const molfile = [
    'nothing here',
    '  OSIRIS test',
    '',
    '  0  0  0  0  0  0  0  0  0  0999 V2000',
    'M  END',
  ].join('\n');
  expect(() => moleculeFromStructure(molfile)).toThrow(NO_ATOMS_MESSAGE);
});

test('a line that is not a structure says what the parser found', () => {
  expect(() => moleculeFromStructure('hello world')).toThrow(
    'unknown element label found',
  );
});

test('a substructure query is refused, because it has no properties', () => {
  expect(() => moleculeFromStructure('[CX3](=O)[OX2H1]')).toThrow(
    QUERY_MESSAGE,
  );
});

test('a SMILES comes back with the drawing the stereo work invented', () => {
  const { coordinates } = describeMolecule(
    moleculeFromStructure('C[C@H](N)C(=O)O'),
  );
  expect(coordinates).toBe('!B?g~H?[_}?g~w@`');
});

test('two enantiomers keep two keys', () => {
  const left = describeMolecule(moleculeFromStructure('C[C@H](N)C(=O)O'));
  const right = describeMolecule(moleculeFromStructure('C[C@@H](N)C(=O)O'));
  expect(left.idCode).toBe('gGX`BDdwMUM@@');
  expect(right.idCode).toBe('gGX`BDdwMUL`@');
  expect(left.smiles).toBe('C[C@@H](C(O)=O)N');
  expect(right.smiles).toBe('C[C@H](C(O)=O)N');
});

test('a molecule drawn with a wedge keeps the key its SMILES has', () => {
  const smiles = moleculeFromStructure('C[C@H](N)C(=O)O');
  smiles.ensureHelperArrays(Molecule.cHelperCIP);
  const drawn = describeMolecule(moleculeFromStructure(smiles.toMolfile()));
  expect(drawn.idCode).toBe('gGX`BDdwMUM@@');
});

test('an idCode that encodes nothing it decodes to is refused', () => {
  expect(() => moleculeFromIdCode('zzz')).toThrow(UNREADABLE_MESSAGE);
});

test('an idCode from the editor is read, coordinates and all', () => {
  const molecule = moleculeFromIdCode('gFp@DiTt@@@ !B?g~w@k_}mwvw?@');
  expect(molecule.getAllAtoms()).toBe(6);
  expect(molecule.toIsomericSmiles()).toBe('c1ccccc1');
});
