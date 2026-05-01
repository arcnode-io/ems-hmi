const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts;

const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  // Reason: workspaces hoist deps to repo root + shared pkg lives outside this dir
  watchFolders: [workspaceRoot],
  resolver: {
    sourceExts: process.env.RN_MOCKED === 'true'
      ? ['mock.ts', 'mock.tsx', ...defaultSourceExts]
      : defaultSourceExts,
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
