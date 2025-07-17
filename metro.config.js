const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ajouter les extensions de fichiers supportées
config.resolver.assetExts.push('json');

module.exports = config;