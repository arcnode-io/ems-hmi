import baseConfig from "../../eslint-security.config.mjs";

export default [
  ...baseConfig,
  {
    ignores: ["android/**", "ios/**", "node_modules/**", ".bundle/**", "tests/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
      },
    },
  },
];
