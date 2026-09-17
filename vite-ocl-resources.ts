import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import type { Plugin } from 'vite';

import { OCL_RESOURCES_PATH } from './src/state/site.ts';

/** The toxicity fragment lists, and the drug-likeness fragment table. */
const KEEP = ['/resources/toxpredictor/', '/resources/druglikeness'];

/**
 * Write OpenChemLib's static resources into `public/` so the prediction worker
 * can fetch them.
 *
 * `ToxicityPredictor` and `DruglikenessPredictor` throw `static resources must
 * be registered first` until `Resources.register*` has run, but
 * `openchemlib/dist/resources.json` is absent from the package's `exports` map,
 * so it cannot be imported — it can only be located by resolving the main entry
 * and walking sideways from it.
 *
 * Only the thirteen keys the two predictors read are kept: 398 kB of the
 * 1.35 MB file, the conformer torsion database and the MMFF94 parameters left
 * behind, because this site never generates a conformer.
 *
 * `public/` rather than `emitFile` because Vite serves it unchanged in dev and
 * copies it on build, so there is one code path instead of two.
 *
 * Written from `configResolved`, which runs before the dev server installs the
 * middleware that serves `public/`: from `buildStart` the file lands after that
 * middleware has taken its listing, so the very first `npm run dev` of a fresh
 * clone answers the worker's fetch with `index.html` and every run dies on
 * `Unexpected token '<'` until the server is restarted.
 * @returns The Vite plugin.
 */
export function oclResources(): Plugin {
  return {
    name: 'osiris-cheminfo:openchemlib-resources',
    configResolved(config) {
      const require = createRequire(import.meta.url);
      const path = require
        .resolve('openchemlib')
        .replace(/openchemlib\.js$/, 'resources.json');
      const all = JSON.parse(readFileSync(path, 'utf8')) as Record<
        string,
        string
      >;

      const kept: Record<string, string> = {};
      for (const key of Object.keys(all)) {
        for (const prefix of KEEP) {
          if (key.startsWith(prefix)) {
            kept[key] = all[key] as string;
            break;
          }
        }
      }
      if (Object.keys(kept).length === 0) {
        throw new Error(
          `No OpenChemLib resources matched ${KEEP.join(', ')} in ${path}. Every prediction would fail at runtime with "static resources must be registered first" while this build stayed green.`,
        );
      }

      const target = join(config.publicDir, OCL_RESOURCES_PATH.slice(1));
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, JSON.stringify(kept));
    },

    /**
     * Drop the untrimmed copy Vite emits on openchemlib's behalf.
     *
     * `openchemlib.js` contains `new URL('resources.json', import.meta.url)` as
     * the default argument of `registerFromUrl()`. Vite's asset pipeline
     * resolves that statically and emits the whole 1.35 MB file, even though
     * every call site here passes an explicit URL, so it is never fetched — it
     * just rides along in the image.
     */
    writeBundle(options, bundle) {
      const directory = options.dir;
      if (directory === undefined) return;
      for (const fileName of Object.keys(bundle)) {
        if (!/resources-[\w-]+\.json$/.test(fileName)) continue;
        const path = join(directory, fileName);
        // Read it back rather than inspect `source`, which is a Uint8Array for
        // a JSON asset. Confirms it really is the openchemlib payload and never
        // some other resources-*.json.
        let head: string;
        try {
          head = readFileSync(path, 'utf8').slice(0, 4096);
        } catch {
          continue;
        }
        if (head.includes('/resources/cod/')) {
          rmSync(path, { force: true });
        }
      }
    },
  };
}
