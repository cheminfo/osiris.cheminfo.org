import { defineConfig, globalIgnores } from 'eslint/config';
import { globals } from 'eslint-config-zakodium';
import react from 'eslint-config-zakodium/react';
import ts from 'eslint-config-zakodium/ts';
import unicorn from 'eslint-config-zakodium/unicorn';

export default defineConfig(
  globalIgnores([
    'coverage',
    'dist',
    'dist-mount',
    'playwright-report',
    'test-results',
  ]),
  ts,
  unicorn,
  react,
  {
    files: [
      'vite.config.ts',
      'vite-ocl-resources.ts',
      'vitest.config.ts',
      'scripts/**',
    ],
    languageOptions: { globals: { ...globals.nodeBuiltin } },
  },
  {
    files: ['src/**/*.tsx'],
    extends: [react],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@blueprintjs/core',
              importNames: ['Popover'],
              message:
                'Blueprint’s legacy Popover does not position itself under React 19: use PopoverNext.',
            },
          ],
        },
      ],
    },
  },
  {
    // The prediction and the reading of a structure are the parts that have to
    // be right, so they stay runnable in plain Node: vitest covers them with no
    // DOM and no mock, and a worker can import them without dragging React in.
    files: ['src/osiris/**', 'src/input/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*'],
              message:
                'src/osiris and src/input are pure domain logic: no React.',
            },
          ],
        },
      ],
    },
  },
  {
    // The one exception: the hook that hands the worker pool to a page. The
    // prediction itself, the worker and the pool stay importable from plain
    // Node, which is what keeps them testable without a DOM.
    files: ['src/osiris/ui/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
