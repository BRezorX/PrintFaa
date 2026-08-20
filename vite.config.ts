import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {spawn, ChildProcess} from 'child_process';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'start-backend',
        configureServer() {
          if ((global as any).backendProcess) {
            try {
              ((global as any).backendProcess as ChildProcess).kill();
            } catch (err) {
              // Ignore
            }
          }
          const backend = spawn('npx', ['tsx', 'server.ts'], {
            stdio: 'inherit',
            shell: true,
          });
          (global as any).backendProcess = backend;
          process.on('exit', () => backend.kill());
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/ws': {
          target: 'ws://localhost:3001',
          ws: true,
        },
      },
    },
  };
});
