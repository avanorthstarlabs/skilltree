const path = require('path');
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
    };
    config.externals.push('pino-pretty', 'encoding');

    // Stub out optional wagmi connector peer deps that aren't installed.
    // @wagmi/connectors dynamically imports these only when the user
    // activates that specific connector, so replacing with an empty
    // module is safe.
    const emptyModule = path.resolve(__dirname, 'lib/empty-module.js');
    const optionalDeps = /^(porto(\/.*)?|@base-org\/account|@gemini-wallet\/core|@safe-global\/safe-apps-(provider|sdk)|@walletconnect\/ethereum-provider|@react-native-async-storage\/async-storage)$/;

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(optionalDeps, emptyModule)
    );

    return config;
  },
};

module.exports = nextConfig;
