/**
 * Build the site and lay it out under a mount path, for the end-to-end case
 * that serves it there. Run with `npm run build-mount`.
 */

import { MOUNT_PATH, buildMountedSite } from './mountedSite.ts';

const mounted = buildMountedSite();
process.stdout.write(`${mounted} written, mounted at ${MOUNT_PATH}/\n`);
