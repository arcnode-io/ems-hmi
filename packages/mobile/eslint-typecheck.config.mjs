import baseConfig from "../../eslint-typecheck.config.mjs";

export default [
  ...baseConfig,
  {
    ignores: ["android/**", "ios/**", "node_modules/**", ".bundle/**", "*.js", "*.mjs", "*.cjs"],
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
