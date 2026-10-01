const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('glb', 'gltf');
config.resolver.useWatchman = true;

module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
