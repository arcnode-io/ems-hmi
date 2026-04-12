import baseConfig from "../../eslint-security.config.mjs";

export default [
  ...baseConfig,
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "src/styled.d.ts", "**/*.test.ts", "**/*.test.tsx"],
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
