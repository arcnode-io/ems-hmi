module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
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
