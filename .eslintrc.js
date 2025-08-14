module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
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
  ],
};