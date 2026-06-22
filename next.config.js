/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  reactStrictMode: true,
  // Reown AppKit / WalletConnect ship untranspiled modern syntax — let Next compile them.
  transpilePackages: ['@reown/appkit', '@reown/appkit-adapter-ethers', '@reown/appkit-common'],
  webpack: (config) => {
    // Web3 libs reference Node built-ins that don't exist in the browser.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    // Polyfill Buffer/process for the browser bundle (WalletConnect needs them).
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      }),
    );
    // Silence optional deps WalletConnect tries to require on the server.
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

module.exports = nextConfig;
