const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts;

const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;
const SHARED_PREFIX = '@ems-hmi/shared/';
const sharedSrc = path.resolve(workspaceRoot, 'packages/shared/src');

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
    // Reason: honour package "exports" conditions (on by default from RN 0.79) —
    // mqtt.js only reaches its RN build (no Node `url`/`net`) through its
    // "react-native" export condition.
    unstable_enablePackageExports: true,
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    // Reason: shared's exports map ("./*": "./src/*") has no extensions, and
    // Metro resolves export targets as exact files — so every subpath import
    // failed. Mirror tsconfig `paths` instead: point the subpath at shared/src
    // and let Metro's normal resolution add the platform ext (.native/.ts/.tsx).
    resolveRequest: (context, moduleName, platform) =>
      context.resolveRequest(
        context,
        moduleName.startsWith(SHARED_PREFIX)
          ? path.join(sharedSrc, moduleName.slice(SHARED_PREFIX.length))
          : moduleName,
        platform,
      ),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
