import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintTypecheckConfig from "../../eslint-typecheck.config.mjs";
import eslintSecurityConfig from "../../eslint-security.config.mjs";

export default tseslint.config(
  ...eslintTypecheckConfig,
  ...eslintSecurityConfig,
  {
    ignores: ["eslint.config.mjs", "android/**", "ios/**", "node_modules/**", ".bundle/**", "tests/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  jsdoc.configs["flat/recommended-typescript"],
  eslintConfigPrettier,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      sourceType: "module",
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "max-params": ["error", 5],
      "max-statements": ["error", 30],
      "jsdoc/require-jsdoc": [
        "error",
        {
          contexts: [
            "FunctionDeclaration",
            "MethodDefinition",
            "ClassDeclaration",
          ],
        },
      ],
      "jsdoc/require-description": "error",
      "jsdoc/require-param-description": "error",
      "jsdoc/require-returns-description": "error",
      "jsdoc/check-tag-names": ["error", { "definedTags": ["format"] }],
      "no-unreachable": "error",
      "default-case": "error",
      "consistent-return": "error",
      "prefer-const": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      complexity: ["error", 15],
      "id-length": ["error", { min: 2, max: 30 }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "react/jsx-key": "error",
      "react/jsx-no-leaked-render": "error",
    },
  }
);
