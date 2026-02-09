import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';
import { resolve } from 'path';

// FIX: `__dirname` is not available in ES modules. This defines it for the current module scope using `import.meta.url`.
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: true, 
      strictPort: true,
      port: 5173,
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.DIRECTUS_CRM_URL': JSON.stringify(env.VITE_DIRECTUS_CRM_URL),
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          chat: resolve(__dirname, 'chat.html'),
          widget: resolve(__dirname, 'widget.js'), // Add widget.js as a build entry point
        },
        output: {
          // By default, Vite adds a hash to filenames for cache-busting.
          // For the public embed script, we need a consistent, predictable filename.
          // This function checks the entry point's name (the key from the 'input' object).
          entryFileNames: chunkInfo => {
            if (chunkInfo.name === 'widget') {
              return '[name].js'; // Outputs 'widget.js' without a hash
            }
            // For all other JS entry points (like main, chat-entry), use a hashed name for better caching.
            return 'assets/[name]-[hash].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
  };
});