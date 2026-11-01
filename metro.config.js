const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block non-mobile directories from Metro bundler watching and scanning
config.resolver.blockList = [
  /legacy-web-archive\/.*/,
  /SoundWave Downloads\/.*/,
  /\.tmp\/.*/,
  /dist\/.*/,
  /backend\/.*/,
];

module.exports = config;
