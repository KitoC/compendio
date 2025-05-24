import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import dotenv from "dotenv";
import { VitePWA } from "vite-plugin-pwa";

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt"],
      manifest: {
        name: "Compendio",
        short_name: "",
        start_url: "/",
        theme_color: "#1e293b",
        background_color: "#1e293b",
        display: "standalone",
        icons: [
          {
            src: "/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
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
      },
    },
    minify: true,
    target: "es2020",
  },
  esbuild: {
    target: "es2020",
    supported: {
      "top-level-await": true,
    },
  },
  optimizeDeps: {
    include: [
      "regenerator-runtime/runtime",
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "@tanstack/react-query",
    ],
    esbuildOptions: {
      target: "es2020",
      supported: {
        "top-level-await": true,
      },
      define: {
        global: "globalThis",
      },
    },
  },
}));
