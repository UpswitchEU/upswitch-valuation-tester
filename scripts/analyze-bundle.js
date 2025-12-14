#!/usr/bin/env node

/**
 * Bundle Analysis Script
 *
 * Analyzes bundle sizes and provides optimization recommendations.
 * Run with: npm run analyze-bundle
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Analyzing bundle sizes...\n')

// Check if bundle stats exist
const statsPath = path.join(__dirname, '..', 'bundle-stats.json')
const reportPath = path.join(__dirname, '..', 'bundle-report.html')

if (!fs.existsSync(statsPath)) {
  console.log('❌ Bundle stats not found. Run "npm run analyze-bundle" first.')
  process.exit(1)
}

try {
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'))

  console.log('📊 Bundle Analysis Results:\n')

  // Analyze chunks
  const chunks = stats.chunks || []
  const assets = stats.assets || []

  console.log('🎯 Largest Chunks:')
  chunks
    .filter(chunk => chunk.size > 10000) // Only show chunks > 10KB
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .forEach((chunk, index) => {
      const sizeKB = (chunk.size / 1024).toFixed(1)
      console.log(`${index + 1}. ${chunk.names?.[0] || 'unnamed'} - ${sizeKB} KB`)
    })

  console.log('\n📦 Largest Assets:')
  assets
    .filter(asset => asset.size > 10000) // Only show assets > 10KB
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .forEach((asset, index) => {
      const sizeKB = (asset.size / 1024).toFixed(1)
      console.log(`${index + 1}. ${asset.name} - ${sizeKB} KB`)
    })

  // Calculate total bundle size
  const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0)
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2)

  console.log(`\n📈 Total Bundle Size: ${totalSizeMB} MB`)

  // Provide recommendations
  console.log('\n💡 Optimization Recommendations:')

  if (totalSize > 5 * 1024 * 1024) { // > 5MB
    console.log('⚠️  Bundle size is large. Consider:')
    console.log('   - Lazy loading more components')
    console.log('   - Code splitting by route/feature')
    console.log('   - Removing unused dependencies')
  }

  if (chunks.some(chunk => chunk.size > 500 * 1024)) { // > 500KB
    console.log('⚠️  Large chunks detected. Consider:')
    console.log('   - Splitting large components')
    console.log('   - Using dynamic imports')
    console.log('   - Optimizing imports')
  }

  // Check for bundle report
  if (fs.existsSync(reportPath)) {
    console.log(`\n📄 Detailed report available: ${reportPath}`)
    console.log('   Open in browser for visual analysis')
  }

} catch (error) {
  console.error('❌ Error analyzing bundle:', error.message)
  process.exit(1)
}