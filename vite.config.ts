import { existsSync } from 'node:fs';
import { join } from 'node:path';

import react from '@vitejs/plugin-react';
import { cheminfoBuildInfo, cheminfoPrerender } from 'react-cheminfo/vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

import { NOSCRIPT_ROUTES, PAGE_ROUTES } from './src/seo/routes.ts';
import { configuredSiteUrl } from './src/state/site.ts';
import { oclResources } from './vite-ocl-resources.ts';

// The site's own port, never Vite's stock 5173: two checkouts must not fight
// over the same one. It is the number compose publishes as well — this site has
// no backend to leave room for, so there is one number, not two. 2026-09-17
// derives 10917, which symmetry.cheminfo.org took the same day, so this comes
// from the 106xx block the family keeps for exactly that case.
const port = Number(process.env.PORT ?? 10_620);

/** Where the build writes the site, one HTML file per routed address. */
const OUT_DIR = 'dist';

export default defineConfig({
  // The build carries no mount path. Every asset is written relative, so the
  // one `dist` serves the site's own host and a path of a shared one without
  // being rebuilt: the `<base>` the container stamps in at startup is what
  // resolves them, and the page reads its mount back off that.
  base: './',
  resolve: {
    // `react-cheminfo` is linked from the checkout next door, so without this
    // its own `node_modules` gives the page a second React: every component it
    // exports then calls hooks against a dispatcher the active renderer never
    // populated, and the first render dies on `Cannot read properties of null`.
    // Blueprint holds context of its own and duplicates the same way.
    dedupe: ['react', 'react-dom', '@blueprintjs/core'],
  },
  plugins: [
    react(),
    oclResources(),
    cheminfoBuildInfo(),
    cheminfoPrerender({
      site: 'osiris',
      routes: PAGE_ROUTES,
      // The published address, mount path included, so every canonical link,
      // `og:url`, card and sitemap entry starts where the site is served.
      origin: configuredSiteUrl(),
      category: 'ScienceApplication',
      operatingSystem: 'Any modern browser',
      description:
        'Draw a molecule and read its predicted toxicity risks, cLogP, solubility, TPSA and drug score, or load a whole set and compare them at once.',
      noscript: {
        heading: 'osiris.cheminfo.org — the property explorer',
        intro:
          'Draw one molecule and read its predicted risks and properties, or load an SDF or a list of SMILES and compare a whole set in a table and a parallel-coordinates plot. Everything is computed in the page, so the tool needs JavaScript; these are the addresses it answers:',
        // The build bakes in no mount, so the crawl path is written against the
        // `<base>` the container stamps in at startup rather than the root of a
        // host this deployment may only share.
        hrefs: 'relative',
        routes: NOSCRIPT_ROUTES,
        ecosystem: { taglines: false },
      },
    }),
    directoryIndex(),
  ],
  server: {
    port,
    // Fail loudly rather than drifting to the next free port, which would leave
    // the Playwright base URL, the dev script and the README disagreeing.
    strictPort: true,
  },
  preview: { port, strictPort: true },
});

/**
 * Serve the preview the way the container's static server does: one file per
 * routed address, resolved without a trailing slash, and no single-page
 * fallback behind it.
 *
 * `SERVER_REDIRECT_TRAILING_SLASH=false` in the Dockerfile, so the address the
 * app writes and the canonical link names is served as it stands rather than
 * redirected — but the preview server resolves a directory index only when a
 * slash closes the address, and falls back to the home page when it cannot.
 * Left alone it answers `/compare` with the home page's head, and the e2e case
 * that reads that head would be testing the client's correction instead. The
 * dev server keeps its fallback, which is the only way it can route at all.
 * @returns The plugin, which touches the preview server and nothing else.
 */
function directoryIndex(): Plugin {
  const root = join(import.meta.dirname, OUT_DIR);
  return {
    name: 'osiris:directory-index',
    config(_config, env) {
      return env.isPreview === true ? { appType: 'mpa' } : {};
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, _response, next) => {
        const url = request.url ?? '/';
        const cut = url.indexOf('?');
        const path = cut === -1 ? url : url.slice(0, cut);
        const query = cut === -1 ? '' : url.slice(cut);
        const inside = path.replaceAll(/^\/+|\/+$/g, '');
        if (inside !== '' && existsSync(join(root, inside, 'index.html'))) {
          request.url = `/${inside}/index.html${query}`;
        }
        next();
      });
    },
  };
}
