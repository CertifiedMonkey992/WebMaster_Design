import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

/* The .tsx components are checked by `npm run typecheck` (tsc); eslint covers
   the JavaScript side of the project. */
export default [
  { ignores: ['docs/**', 'node_modules/**', '**/*.ts', '**/*.tsx'] },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      /* The two classic hooks rules. The React Compiler–derived set
         (react-hooks/refs, purity, set-state-in-effect …) is not enabled: the
         progression provider deliberately holds its state in a ref and reads
         it during render (see ProgressionContext.jsx), and the motion
         library mounts-then-measures in effects by design. */
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      /* Empty catch blocks are how this codebase degrades gracefully when
         storage or matchMedia is unavailable; each one carries a comment. */
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['vite.config.js', 'scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.node },
  },
]
