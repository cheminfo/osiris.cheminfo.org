import { defaultExclude, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // e2e/*.spec.ts belongs to playwright, which vitest cannot run.
    exclude: [...defaultExclude, 'e2e/**'],
    // A test that touches the predictions pays openchemlib's price: importing
    // the 1.1 MB library, registering its fragment tables, and then ~210-380 ms
    // per molecule assessed. The predictor suite measures 16 s of real work on
    // an idle machine, so the 5 s default fails it on a busy one - and a
    // per-test override on every such file would be the same number written
    // eight times. A hang still fails here, only later.
    testTimeout: 60_000,
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      // istanbul, not v8: openchemlib is a heavy dependency and v8 precise
      // coverage profiles every call inside it, which multiplies the run.
      provider: 'istanbul',
    },
    snapshotFormat: {
      maxOutputLength: Number.MAX_SAFE_INTEGER,
    },
  },
});
