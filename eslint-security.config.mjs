import security from "eslint-plugin-security";
import noSecrets from "eslint-plugin-no-secrets";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      security,
      "no-secrets": noSecrets,
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
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
      "no-secrets/no-secrets": ["error", { tolerance: 4.2 }],
      "id-length": ["error", { min: 2, max: 30 }],
    },
  },
];
