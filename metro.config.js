const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Block ONLY the root non-app project directories so node_modules/packages with /dist/ are never blocked
const dirsToBlock = [
  path.resolve(__dirname, 'legacy-web-archive'),
  path.resolve(__dirname, 'SoundWave Downloads'),
  path.resolve(__dirname, '.tmp'),
  path.resolve(__dirname, 'dist'),
  path.resolve(__dirname, 'backend'),
  path.resolve(__dirname, '.git'),
];

config.resolver.blockList = dirsToBlock.map(dir => new RegExp(`^${escapeRegExp(dir)}[\\\\/].*`));

module.exports = config;
