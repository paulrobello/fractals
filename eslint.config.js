import js from '@eslint/js';
import globals from 'globals';

export default [
  // Ignore build artifacts and non-source directories
  {
    ignores: ['dist/**', 'node_modules/**', 'docs/**', 'public/**'],
  },

  // Base recommended rules
  js.configs.recommended,

  // App source (browser, ES modules)
  {
    files: ['src/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
    rules: {
      // Project style
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      semi: ['error', 'always'],

      // Practical defaults (tuned to reduce noise)
      'no-console': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-useless-escape': 'warn',
      'no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Vite config runs in Node context
  {
    files: ['vite.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
  },
];
