import baseConfig from "../../eslint-typecheck.config.mjs";

export default [
  ...baseConfig,
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "*.js", "*.mjs", "*.cjs"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"],
      },
    },
  },
];
