import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'dapp' ? './' : '/',
  plugins: [react()],
  build: {
    outDir: mode === 'dapp' ? 'dApp' : 'dist',
    emptyOutDir: true,
    target: 'es2022'
  }
}));
