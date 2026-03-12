import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const safePublicDir = path.resolve(__dirname, '.public-safe');

function prepareSafePublic() {
  if (!fs.existsSync(safePublicDir)) fs.mkdirSync(safePublicDir, { recursive: true });
  const publicDir = path.resolve(__dirname, 'public');
  for (const file of fs.readdirSync(publicDir)) {
    if (file.includes(' copy')) continue;
    const src = path.join(publicDir, file);
    const dest = path.join(safePublicDir, file);
    try { fs.copyFileSync(src, dest); } catch { /* skip */ }
  }
}

prepareSafePublic();

export default defineConfig({
  publicDir: safePublicDir,
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'ethers'],
    alias: {
      '@tanstack/react-query': path.resolve(
        __dirname,
        'node_modules/@thirdweb-dev/react-core/node_modules/@tanstack/react-query'
      ),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      '@thirdweb-dev/react',
      '@thirdweb-dev/react-core',
    ],
  },
});
