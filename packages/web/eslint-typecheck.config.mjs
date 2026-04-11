import tseslint from "typescript-eslint";

export default [
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "*.js", "*.mjs", "*.cjs"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"],
      },
    },
    settings: {
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/no-empty-object-type": ["error", { "allowInterfaces": "with-single-extends" }],
      "import/no-extraneous-dependencies": "off",
      "id-length": ["error", { min: 2, max: 30 }],
    },
  },
];
