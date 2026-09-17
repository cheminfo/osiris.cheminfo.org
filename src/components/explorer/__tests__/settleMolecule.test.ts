/**
 * What the panel shows while a structure is being read, has been read, or will
 * not read at all. The four answers depend on each other, so they are settled
 * by one function and checked here with no DOM and no worker.
 */

import { expect, test } from 'vitest';

import type { OsirisProperties } from '../../../osiris/index.ts';
import type { ExplorerRequest } from '../explorerRequest.ts';
import type { MoleculeInputs } from '../useExplorerMolecule.ts';
import { settleMolecule } from '../useExplorerMolecule.ts';

const READY: ExplorerRequest = {
  kind: 'ready',
  structure: { idCode: 'gFp@DiTt@@@', coordinates: '!Bb@_Ohp`' },
};

function predicted(smiles: string): OsirisProperties {
  return {
    idCode: 'gFp@DiTt@@@',
    smiles,
    label: smiles,
    molecularFormula: 'C6H6',
    molecularWeight: 78.113_64,
    logP: 1.6596,
    logS: -1.616,
    polarSurfaceArea: 0,
    druglikeness: -4.8375,
    drugScore: 0.062_941_190_977_554_32,
    acceptorCount: 0,
    donorCount: 0,
    stereoCenterCount: 0,
    rotatableBondCount: 0,
    risks: {
      mutagenic: 'high',
      tumorigenic: 'high',
      irritant: 'high',
      reproductive: 'high',
    },
  };
}

function inputs(overrides: Partial<MoleculeInputs> = {}): MoleculeInputs {
  return {
    request: READY,
    resolved: { pending: false, problem: null },
    linkedSmiles: '',
    properties: undefined,
    failure: undefined,
    kept: null,
    ...overrides,
  };
}

test('an empty canvas shows nothing, and is not waiting for anything', () => {
  const settled = settleMolecule(
    inputs({ request: { kind: 'empty' }, properties: undefined }),
  );

  expect(settled).toStrictEqual({
    properties: null,
    coordinates: '',
    pending: false,
    problem: null,
    smiles: '',
  });
});

test('a structure with no answer yet is pending, not failed', () => {
  const settled = settleMolecule(inputs());

  expect(settled.pending).toBe(true);
  expect(settled.problem).toBeNull();
  expect(settled.properties).toBeNull();
  expect(settled.coordinates).toBe('!Bb@_Ohp`');
});

test('a linked SMILES being read is pending before it is a structure', () => {
  const settled = settleMolecule(
    inputs({
      request: { kind: 'resolve', smiles: 'c1ccccc1' },
      resolved: { pending: true, problem: null },
      linkedSmiles: 'c1ccccc1',
    }),
  );

  expect(settled.pending).toBe(true);
  expect(settled.problem).toBeNull();
  // Nothing has been read, so the address is still the only SMILES there is.
  expect(settled.smiles).toBe('c1ccccc1');
});

test('an answered structure shows itself, and hands on its canonical SMILES', () => {
  const settled = settleMolecule(
    inputs({ properties: predicted('C1=CC=CC=C1'), linkedSmiles: 'c1ccccc1' }),
  );

  expect(settled.pending).toBe(false);
  expect(settled.properties?.molecularFormula).toBe('C6H6');
  // The prediction knows the canonical form; the address carried the typed one.
  expect(settled.smiles).toBe('C1=CC=CC=C1');
});

test('a SMILES that will not read says why, and predicts nothing', () => {
  const settled = settleMolecule(
    inputs({
      request: { kind: 'resolve', smiles: 'c1ccccc' },
      resolved: { pending: false, problem: 'Dangling ring closure: 1' },
      linkedSmiles: 'c1ccccc',
    }),
  );

  expect(settled.problem).toBe('Dangling ring closure: 1');
  expect(settled.pending).toBe(false);
  expect(settled.properties).toBeNull();
});

test('a structure that was refused keeps the last good panel behind the problem', () => {
  const kept = predicted('C1=CC=CC=C1');
  const settled = settleMolecule(
    inputs({ failure: 'This structure could not be read.', kept }),
  );

  expect(settled.problem).toBe('This structure could not be read.');
  expect(settled.properties).toBe(kept);
  expect(settled.pending).toBe(false);
});

test('a problem with nothing before it empties the panel rather than inventing one', () => {
  const settled = settleMolecule(
    inputs({ failure: 'This structure holds no atom.', kept: null }),
  );

  expect(settled.properties).toBeNull();
  expect(settled.problem).toBe('This structure holds no atom.');
});
