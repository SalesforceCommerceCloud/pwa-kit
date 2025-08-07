import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './packages/template-chakra-storefront/src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@chakra-ui/react'],
  },
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],
    },
  },
});
