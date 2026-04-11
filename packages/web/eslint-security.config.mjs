import security from "eslint-plugin-security";
import noSecrets from "eslint-plugin-no-secrets";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "src/styled.d.ts", "**/*.test.ts", "**/*.test.tsx"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"],
      },
    },
    plugins: {
      security,
      "no-secrets": noSecrets,
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      // Security plugin rules
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "warn",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-non-literal-regexp": "error",
      "security/detect-non-literal-require": "warn",
      "security/detect-object-injection": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "error",
      "security/detect-unsafe-regex": "error",

      // No secrets plugin rules
      "no-secrets/no-secrets": [
        "error",
        {
          tolerance: 4.2,
        },
      ],
      // Consistency with main eslint config
      "id-length": ["error", { min: 2, max: 30 }],
    },
  },
];
