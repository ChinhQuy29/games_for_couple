import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': { target: 'http://localhost:3001', ws: true },
      // Jjinja Battle is served by the game server, not by this React app.
      '/jjinja': { target: 'http://localhost:3001', ws: true },
    },
  },
});
