import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'src', 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src', 'index.html'),
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    {
      name: 'copy-sw',
      writeBundle() {
        // Copy service worker to dist root after build
        try {
          copyFileSync(
            resolve(__dirname, 'src', 'public', 'sw.js'),
            resolve(__dirname, 'dist', 'sw.js')
          );
          console.log('Service worker copied to dist');
        } catch (err) {
          console.error('Failed to copy service worker:', err);
        }
      }
    }
  ]
});
