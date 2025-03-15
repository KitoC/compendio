
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
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Expose environment variables to the client
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL
    ),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY
    ),
    "import.meta.env.VITE_BACKEND_URL": JSON.stringify(
      process.env.VITE_BACKEND_URL
    ),
    "import.meta.env.VITE_SKYBROOK_API_KEY": JSON.stringify(
      process.env.VITE_SKYBROOK_API_KEY
    ),
  },
  build: {
    ...(command === "build" && process.env.LIB_BUILD === "true"
      ? {
          lib: {
            entry: path.resolve(__dirname, "src/lib/cdn-export.ts"),
            name: "ConvoSyncLib",
            formats: ["iife"],
            fileName: () => "convosync-lib.js",
          },
          outDir: "dist/cdn",
          emptyOutDir: false,
        }
      : {}),
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        widget: path.resolve(__dirname, "src/lib/cdn-widget.ts"),
      },
      output: {
        entryFileNames: (assetInfo) => {
          return assetInfo.name === "widget"
            ? "assets/chat-widget.[hash].js"
            : "assets/[name].[hash].js";
        },
        // Configure improved chunk splitting
        manualChunks: (id) => {
          // Create separate chunks for React and React DOM to ensure they are correctly bundled together
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react'; // Bundle React and React DOM together
            }
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('react-router')) return 'vendor-react-router';
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            return 'vendor'; // other dependencies
          }
          
          // Split app code by main directories
          if (id.includes('/src/pages/')) return 'pages';
          if (id.includes('/src/components/')) return 'components';
          if (id.includes('/src/hooks/')) return 'hooks';
          if (id.includes('/src/contexts/')) return 'contexts';
        },
      },
    },
    target: "es2017",
  },
  esbuild: {
    target: "es2017",
    supported: {
      "top-level-await": true,
    },
  },
  optimizeDeps: {
    include: ["regenerator-runtime/runtime", "react", "react-dom"],
    esbuildOptions: {
      target: "es2017",
      supported: {
        "top-level-await": true,
      },
      define: {
        global: "globalThis",
      },
    },
  },
}));
