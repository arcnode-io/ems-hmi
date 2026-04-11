const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    sourceExts: process.env.RN_MOCKED === 'true'
      ? ['mock.ts', 'mock.tsx', ...defaultSourceExts]
      : defaultSourceExts,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
