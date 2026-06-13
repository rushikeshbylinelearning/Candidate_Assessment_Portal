import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Keep the full React runtime in one chunk — splitting it causes "Cannot read properties of undefined (reading 'memo')" in production. */
function isReactRuntime(id) {
  return (
    id.includes('node_modules/react/')
    || id.includes('node_modules/react-dom/')
    || id.includes('node_modules/react-router')
    || id.includes('node_modules/react-hot-toast/')
    || id.includes('node_modules/scheduler/')
    || id.includes('node_modules/use-sync-external-store/')
  );
}

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
            if (isReactRuntime(id)) return 'react-vendor';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('axios')) return 'http';
            return undefined;
          }
          if (id.includes('/pages/candidate/')) return 'candidate-pages';
          if (id.includes('/pages/hr/')) return 'hr-pages';
        },
      },
    },
  },
  server: {
    port: 5176,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
      '/sso-login': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.js',
  },
});
