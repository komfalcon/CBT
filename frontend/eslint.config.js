import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const browserGlobals = {
  window: 'readonly', document: 'readonly', navigator: 'readonly', console: 'readonly',
  localStorage: 'readonly', sessionStorage: 'readonly', fetch: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
  URL: 'readonly', URLSearchParams: 'readonly', FormData: 'readonly', File: 'readonly',
  Blob: 'readonly', Event: 'readonly', MessageChannel: 'readonly', HTMLElement: 'readonly',
  HTMLInputElement: 'readonly', HTMLButtonElement: 'readonly',
};

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '**/*.cjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: browserGlobals },
    rules: {
      'no-undef': 'off',
      'no-cond-assign': 'off',
      'no-empty': 'off',
      'no-prototype-builtins': 'off',
      'no-misleading-character-class': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
