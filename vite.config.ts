
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    ...(command === 'build' && process.env.LIB_BUILD === 'true' ? {
      lib: {
        entry: path.resolve(__dirname, 'src/lib/cdn-export.ts'),
        name: 'ConvoSyncLib',
        formats: ['iife'],
        fileName: () => 'convosync-lib.js',
      },
      outDir: 'dist/cdn',
      emptyOutDir: false,
    } : {})
  }
}));
