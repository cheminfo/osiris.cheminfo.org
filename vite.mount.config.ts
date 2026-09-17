import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

import {
  MOUNT_DIRECTORY,
  MOUNT_PATH,
  MOUNT_PREVIEW_PORT,
  PROJECT_ROOT,
} from './scripts/mountedSite.ts';

/**
 * Serve the mounted copy of the build the way the deployment does: under
 * `/osiris/`, one tool among several on a shared host.
 *
 * It is a preview, never a build — `npm run build-mount` writes `dist-mount`
 * by running `docker-entrypoint.sh` over `dist`, so what is served here is the
 * image's own output, base stamped in and all.
 */
export default defineConfig({
  base: `${MOUNT_PATH}/`,
  // No single-page fallback. The build writes one file per routed address, and
  // the container serves them as they are: an address that is not on disk is
  // not a page of this site and must answer 404 here too, or a missing page
  // would pass this check by being quietly served as the home page.
  appType: 'mpa',
  build: { outDir: MOUNT_DIRECTORY },
  preview: { port: MOUNT_PREVIEW_PORT, strictPort: true },
  plugins: [directoryIndex()],
});

/**
 * Answer `/osiris/method` with `method/index.html`, as the container's static
 * server does.
 *
 * `SERVER_REDIRECT_TRAILING_SLASH=false` in the Dockerfile: the address the app
 * writes and the canonical link names has no trailing slash, and it is served
 * as it stands rather than redirected. The preview server resolves a directory
 * only when a slash closes the address, so this closes the gap between the two.
 * @returns The plugin, which touches the preview server and nothing else.
 */
function directoryIndex(): Plugin {
  const root = join(PROJECT_ROOT, MOUNT_DIRECTORY);
  return {
    name: 'osiris:directory-index',
    configurePreviewServer(server) {
      server.middlewares.use((request, _response, next) => {
        const url = request.url ?? '/';
        const cut = url.indexOf('?');
        const path = cut === -1 ? url : url.slice(0, cut);
        const query = cut === -1 ? '' : url.slice(cut);
        const inside = path.startsWith(`${MOUNT_PATH}/`)
          ? path.slice(MOUNT_PATH.length + 1).replace(/\/+$/, '')
          : '';
        if (inside !== '' && existsSync(join(root, inside, 'index.html'))) {
          request.url = `${MOUNT_PATH}/${inside}/index.html${query}`;
        }
        next();
      });
    },
  };
}
