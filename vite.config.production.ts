import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Production configuration for tester.upswitch.com
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@heroui/react', '@heroui/theme', 'framer-motion'],
          charts: ['recharts'],
          utils: ['axios', 'zustand', 'lucide-react']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 3001,
    host: true,
  },
  preview: {
    port: 3001,
    host: true,
  },
  define: {
    // Environment variables for production
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
