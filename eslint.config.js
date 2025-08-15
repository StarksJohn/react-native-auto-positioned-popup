const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Basic ESLint rules
      'no-unused-vars': 'off', // Disable base rule as it can conflict with TypeScript
      'no-undef': 'off', // Disable as TypeScript handles this
      'no-redeclare': 'off',
      
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      
      // Code quality rules
      'prefer-const': 'warn',
      'no-console': 'off',
      'no-debugger': 'warn',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Additional TypeScript-specific rules for .ts/.tsx files
    },
  },
];