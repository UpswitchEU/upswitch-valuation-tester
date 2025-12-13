/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Bundle splitting optimizations
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        ui: {
          test: /[\\/]node_modules[\\/](@heroui|@tailwindcss|framer-motion|lucide-react)[\\/]/,
          name: 'ui',
          chunks: 'all',
          priority: 15,
        },
        conversational: {
          test: /[\\/]src[\\/]features[\\/]conversational[\\/]/,
          name: 'conversational',
          chunks: 'all',
          priority: 5,
        },
        manual: {
          test: /[\\/]src[\\/]features[\\/]manual[\\/]/,
          name: 'manual',
          chunks: 'all',
          priority: 5,
        },
        utils: {
          test: /[\\/]src[\\/](utils|hooks|services)[\\/]/,
          name: 'utils',
          chunks: 'all',
          priority: 5,
        },
      }
    }

    config.optimization.minimize = true

    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://web-production-8d00b.up.railway.app/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig