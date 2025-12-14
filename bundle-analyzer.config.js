/**
 * Bundle Analyzer Configuration
 *
 * Analyzes bundle sizes and provides optimization recommendations.
 * Run with: npm run analyze-bundle
 */

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const path = require('path')

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: path.join(__dirname, 'bundle-report.html'),
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: path.join(__dirname, 'bundle-stats.json'),
      statsOptions: {
        assets: true,
        chunks: true,
        modules: true,
        reasons: true,
        optimizationBailout: true,
      },
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunks
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        // React ecosystem
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        // UI libraries
        ui: {
          test: /[\\/]node_modules[\\/](@heroui|@headlessui|lucide-react)[\\/]/,
          name: 'ui',
          chunks: 'all',
          priority: 15,
        },
        // Feature-specific chunks
        conversational: {
          test: /features[\\/]conversational-valuation/,
          name: 'conversational-valuation',
          chunks: 'all',
          priority: 5,
        },
        manual: {
          test: /features[\\/]manual-valuation/,
          name: 'manual-valuation',
          chunks: 'all',
          priority: 5,
        },
        // Shared utilities
        shared: {
          test: /features[\\/]shared/,
          name: 'shared',
          chunks: 'all',
          priority: 5,
        },
      },
    },
  },
}
