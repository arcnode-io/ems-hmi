module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Reason: zod v4 ships `export * as ns from`, which RN 0.76's preset can't parse.
    '@babel/plugin-transform-export-namespace-from',
    [
      'inline-import',
      {
        extensions: ['.yml', '.yaml'],
      },
    ],
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
      },
    ],
  ],
};
