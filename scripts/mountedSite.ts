/**
 * The same build, under a mount path — which is the deployment the asset rule
 * exists for.
 *
 * Nothing about it is a second build: `dist` carries no mount at all, and what
 * tells two deployments apart is the `<base>` the container stamps into every
 * page when it starts. So this runs `docker-entrypoint.sh` itself, over the
 * checkout's own `dist`, rather than stamping the base with a copy of that
 * logic — a test that reimplements the step it is checking proves nothing
 * about the copy that ships.
 *
 * What comes out is `dist-mount`: the site as it is served at `/osiris/`. The
 * mount-path test reads it back (`scripts/__tests__/mountPath.test.ts`) and
 * `vite.mount.config.ts` serves it for the end-to-end case.
 */

import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';

/** The checkout, whatever directory the caller happens to be in. */
export const PROJECT_ROOT = join(import.meta.dirname, '..');

/** The mount the checks use: one tool among several on a shared host. */
export const MOUNT_PATH = '/osiris';

/** Where the mounted copy is written. Gitignored; rebuilt by every check. */
export const MOUNT_DIRECTORY = 'dist-mount';

/**
 * The port the mounted copy is previewed on for the end-to-end case.
 *
 * The site's own number, plus one. It is not a second front door — nothing is
 * ever deployed on it — it is the second server one Playwright run needs, the
 * site at the root and the same site under a path, so that a spec can compare
 * them.
 */
export const MOUNT_PREVIEW_PORT = Number(
  process.env.MOUNT_PORT ?? Number(process.env.PORT ?? 10_620) + 1,
);

/** The address the mounted copy is served at while the end-to-end case runs. */
export const MOUNT_PREVIEW_URL = `http://localhost:${MOUNT_PREVIEW_PORT}${MOUNT_PATH}/`;

/**
 * Build the site and lay it out as a deployment mounted under a path.
 *
 * The analytics snippet is deliberately cleared: a developer with one in their
 * environment would otherwise get a different build from a fresh checkout's,
 * and the check reads the build back.
 * @param mountPath - Where the copy answers. @default MOUNT_PATH
 * @returns The absolute path of the mounted copy.
 */
export function buildMountedSite(mountPath: string = MOUNT_PATH): string {
  const built = join(PROJECT_ROOT, 'dist');
  const mounted = join(PROJECT_ROOT, MOUNT_DIRECTORY);

  execFileSync('npm', ['run', 'build'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });
  rmSync(mounted, { recursive: true, force: true });
  execFileSync('sh', [join(PROJECT_ROOT, 'docker-entrypoint.sh')], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      DIST_DIR: built,
      SERVER_ROOT: mounted,
      BASE_PATH: mountPath,
      TRACKING_SCRIPT: '',
    },
  });
  return mounted;
}
