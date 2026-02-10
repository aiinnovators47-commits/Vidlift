/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel-specific optimizations
  output: 'standalone',
  distDir: '.next',
  
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  // Enable SWC minification
  swcMinify: true,
  // Optimize fonts
  optimizeFonts: true,
  // Compress responses
  compress: true,
  // Enable React production optimizations
  reactStrictMode: true,
  // Configure webpack for better performance
  webpack: (config, { dev, isServer }) => {
    // Reduce bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
        },
      };
    }
    
    // Exclude large modules from server bundle for Vercel
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        'canvas',
        'sharp'
      ];
    }
    
    return config;
  },
}

export default nextConfig
