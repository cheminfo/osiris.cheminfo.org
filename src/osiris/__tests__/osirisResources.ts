/**
 * The resource tables the tests register, read the way the build writes them.
 *
 * `public/openchemlib-resources.json` is written by the Vite plugin and is not
 * in the repository, so the tests resolve the package's own `resources.json`
 * and keep the same thirteen keys the plugin keeps — which also proves that
 * subset is enough to predict with.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import type { OsirisPredictors, ResourceSource } from '../core/index.ts';
import { loadPredictors } from '../core/index.ts';

/** The prefixes `vite-ocl-resources.ts` keeps. */
const KEEP = ['/resources/toxpredictor/', '/resources/druglikeness'];

/**
 * The thirteen OSIRIS resource tables.
 * @returns The tables, keyed as OpenChemLib names them.
 */
export function osirisResources(): Record<string, string> {
  const require = createRequire(import.meta.url);
  const path = require
    .resolve('openchemlib')
    .replace(/openchemlib\.js$/, 'resources.json');
  const all = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;

  const kept: Record<string, string> = {};
  for (const key of Object.keys(all)) {
    for (const prefix of KEEP) {
      if (key.startsWith(prefix)) {
        kept[key] = all[key] as string;
        break;
      }
    }
  }
  return kept;
}

/**
 * OpenChemLib, registered from those tables and checked.
 * @param source - What to register instead, for a test that wants it to fail.
 * @returns The predictors.
 */
export function testPredictors(
  source: ResourceSource = osirisResources(),
): Promise<OsirisPredictors> {
  return loadPredictors(source);
}
