import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import federation from '@originjs/vite-plugin-federation';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        watch_app: 'http://localhost:4173/assets/remoteEntry.js',
        // Remote apps will be configured here when needed
        // Example: 'remoteApp': 'http://localhost:4001/assets/remoteEntry.js'
      },
      shared: ['react', 'react-dom', 'react-router-dom']
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
}));
