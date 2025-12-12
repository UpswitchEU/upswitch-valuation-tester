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
    chunkSizeWarningLimit: 1000, // Increase to reduce warnings
    // Remove manual chunking - let Vite handle it automatically
    // This prevents React loading order issues
    rollupOptions: {
      output: {
        // Only split out the largest libraries to keep bundle sizes reasonable
        manualChunks: (id) => {
          // Only split out very large libraries that are rarely used
          if (id.includes('html2pdf') || id.includes('html2canvas') || id.includes('jspdf')) {
            return 'pdf-vendor';
          }
          // Split out ValuationReport component if it's large
          if (id.includes('ValuationReport')) {
            return 'valuation-report';
          }
          // Let Vite automatically handle all other chunking
          // This ensures React and dependencies load in correct order
        },
      }
    }
  },
});
