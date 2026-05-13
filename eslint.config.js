import js from 'eslint-plugin-svelte';
import tsParser from '@typescript-eslint/parser';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default [
  {
    ignores: ['build/', '.svelte-kit/', 'dist/'],
  },
  ...js.configs['flat/recommended'],
  {
    files: ['src/lib/engines/**/*.ts', 'src/lib/utils/**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
  },
  {
    files: ['**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
      },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-undef': 'error',
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    },
  },
  {
    files: ['src/lib/engines/**/*.ts', 'src/lib/utils/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['$lib/db/*', '../db/*', '../../db/*'],
              message:
                'Core (engines/, utils/) must not import shell (db/). Move the I/O to the caller and pass data as arguments.',
            },
            {
              group: ['$lib/components/*', '../components/*', '../../components/*'],
              message:
                'Core (engines/, utils/) must not import shell (components/). Move the UI logic to the component and pass data as arguments.',
            },
          ],
        },
      ],
    },
  },
];
