/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Node.js polyfills for Solana
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
      net: false,
      tls: false,
      "pino-pretty": false,
    };

    // Force all bs58 imports to the root package (fixes broken nested ESM paths)
    config.resolve.alias = {
      ...config.resolve.alias,
      "bs58": require.resolve("bs58"),
    };

    return config;
  },
};

module.exports = nextConfig;
