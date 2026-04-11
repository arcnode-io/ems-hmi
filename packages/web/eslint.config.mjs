import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintTypecheckConfig from "./eslint-typecheck.config.mjs";
import eslintSecurityConfig from "./eslint-security.config.mjs";
import tamaguiPlugin from "./eslint-plugin-tamagui/index.mjs";

export default tseslint.config(
  ...eslintTypecheckConfig,
  ...eslintSecurityConfig,
  {
    ignores: ["eslint.config.mjs", "dist/**", "node_modules/**"],
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
      'tamagui': tamaguiPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      sourceType: "module",
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"],
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
      "max-params": ["error", 5], // max-args = 5
      "max-statements": ["error", 30], // max-statements = 30
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
      "default-case": "error", // Exhaustive switch cases
      "consistent-return": "error", // Explicit returns
      "prefer-const": "error", // Immutability like Rust
      "@typescript-eslint/switch-exhaustiveness-check": "error", // Match Rust pattern exhaustiveness
      // Anti-agent-bias rules
      complexity: ["error", 15], // Cognitive complexity limit
      // "no-magic-numbers": ["error", {"ignore": [0, 1, -1]}], // Disabled - no equivalent scope to Python PLR2004 (comparison-only)
      "id-length": ["error", { min: 2, max: 30 }], // Variable name length
      // React Hooks strict rules
      "react-hooks/rules-of-hooks": "error", // Enforce Rules of Hooks
      "react-hooks/exhaustive-deps": "error", // Strict dependency arrays (upgraded from warn)
      // React strict anti-pattern rules
      "react/jsx-key": "error", // Require key prop in lists
      "react/jsx-no-leaked-render": "error", // Prevent leaked boolean renders
      // Tamagui font rules
      "tamagui/require-font-weight": "error", // Require fontWeight on styled Text
    },
  }
);
