import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'dapp' ? './' : '/',
  plugins: [react()],
  build: {
    outDir: mode === 'dapp' ? 'dApp' : 'dist',
    emptyOutDir: true,
    target: 'es2022',
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'three-vendor';
          }
          if (id.includes('packages/cbrain/src/brain4d')) {
            return 'cbrain-4d';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          return undefined;
        }
      }
    }
  }
}));
