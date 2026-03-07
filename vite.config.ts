import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@tanstack/react-query': path.resolve(
        __dirname,
        'node_modules/@thirdweb-dev/react-core/node_modules/@tanstack/react-query'
      ),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['@thirdweb-dev/react-core > @tanstack/react-query'],
  },
});
