import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  server: {
    port: 3001,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 600, // Increase limit slightly but still warn for very large chunks
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // CRITICAL: Keep React in main bundle (return undefined)
            // This ensures React is always available when main.tsx executes
            // Splitting React causes "Cannot read properties of undefined" errors
            if (
              id.includes('react') || 
              id.includes('react-dom') || 
              id.includes('react-router')
            ) {
              return undefined; // undefined = main bundle
            }
            // React-dependent libraries can be split, but React must be in main bundle
            if (
              id.includes('zustand') || 
              id.includes('react-hot-toast') || 
              id.includes('react-dropzone')
            ) {
              return 'react-vendor';
            }
            // UI libraries (depend on React)
            if (id.includes('@heroui') || id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'ui-vendor';
            }
            // PDF/Canvas libraries (large, should be lazy-loaded)
            if (id.includes('html2pdf') || id.includes('html2canvas') || id.includes('jspdf')) {
              return 'pdf-vendor';
            }
            // Chart libraries
            if (id.includes('recharts') || id.includes('chart')) {
              return 'charts-vendor';
            }
            // Utility libraries (non-React dependent)
            if (id.includes('axios') || id.includes('pino')) {
              return 'utils-vendor';
            }
            // Other node_modules
            return 'vendor';
          }
          // Large components that should be code-split
          if (id.includes('ValuationReport')) {
            return 'valuation-report';
          }
        },
      }
    }
  },
});
