import type { NextConfig } from 'next';
import type { Configuration as WebpackConfig } from 'webpack';

const nextConfig: NextConfig = {
  webpack: (config: WebpackConfig, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      config.externals = [...(config.externals as string[] || []), 'firebase-admin'];
    }
    return config;
  },
};

export default nextConfig;
