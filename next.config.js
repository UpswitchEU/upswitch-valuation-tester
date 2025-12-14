/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
=======
  // Enable experimental features for better performance
>>>>>>> refactor-gtm
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
<<<<<<< HEAD
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
=======

  // Optimize bundle splitting and tree-shaking
  webpack: (config, { dev, isServer }) => {
    // Exclude vitest.config.ts from being processed by Next.js
    config.module.rules.push({
      test: /vitest\.config\.ts$/,
      loader: 'ignore-loader',
    })

    // Production optimizations
    if (!dev && !isServer) {
      // Enable webpack optimizations for better tree-shaking
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // React ecosystem
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|@heroui)[\\/]/,
              name: 'react-vendor',
              chunks: 'all',
              priority: 20,
            },
            // UI components
            ui: {
              test: /[\\/]node_modules[\\/](lucide-react|framer-motion)[\\/]/,
              name: 'ui-vendor',
              chunks: 'all',
              priority: 15,
            },
            // Feature modules - using streaming chat for conversational flow
            streaming: {
              test: /src[\\/]components[\\/]StreamingChat/,
              name: 'streaming-feature',
              chunks: 'all',
              priority: 5,
            },
            // Utility modules
            utils: {
              test: /src[\\/]utils[\\/]/,
              name: 'utils',
              chunks: 'all',
              priority: 5,
            },
          },
        },
        // Enable more aggressive minification
        minimize: true,
      }
    }

    return config
  },

  // Configure images
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Configure headers for security
>>>>>>> refactor-gtm
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
<<<<<<< HEAD
=======

  // Configure rewrites for API routes
>>>>>>> refactor-gtm
  async rewrites() {
    return [
      {
        source: '/api/:path*',
<<<<<<< HEAD
        destination: 'https://web-production-8d00b.up.railway.app/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
=======
        destination: '/api/:path*',
      },
    ]
  },

  // Bundle analyzer configuration
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      if (!dev && !isServer) {
        config.plugins.push(
          new webpack.DefinePlugin({
            __BUNDLE_ANALYZE__: JSON.stringify(true),
          })
        )
      }
      return config
    },
  }),
}

export default nextConfig
>>>>>>> refactor-gtm
