import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const routedHost = process.env.PORTLESS_URL ? new URL(process.env.PORTLESS_URL).hostname : undefined;

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
    strictPort: true,
    allowedHosts: routedHost ? [routedHost] : [],
  },
  preview: { host: '127.0.0.1', strictPort: true },
});
