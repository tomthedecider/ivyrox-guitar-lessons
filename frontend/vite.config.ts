import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "Ivyrox",
        short_name: "Ivyrox",
        description: "Guitar lesson assignments, practice library, and progress tracking.",
        theme_color: "#1c1917",
        background_color: "#1c1917",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precached build assets (JS/CSS/HTML) get an offline-capable app
        // shell — safe because Vite content-hashes filenames, so a new
        // deploy is always a cache miss, never stale code served forever.
        // API responses are explicitly never cached (NetworkOnly below):
        // lesson data must always be live, never served stale from a
        // previous visit.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
