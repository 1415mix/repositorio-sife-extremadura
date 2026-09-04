import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["brand/sife-logo.png", "brand/sife-mark.svg", "brand/favicon.svg", "brand/sife-192.png", "brand/sife-512.png", "brand/sife-maskable-512.png", "brand/hero-documentos-sife.jpg"],
      manifest: {
        name: "SIFE Normativa Extremadura",
        short_name: "SIFE",
        description: "Repositorio jurídico-operativo del Servicio de Innovación, Formación del Profesorado y Emprendimiento de Extremadura.",
        lang: "es",
        start_url: "/",
        display: "standalone",
        theme_color: "#a73400",
        background_color: "#f5faff",
        icons: [
          { src: "/brand/sife-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/brand/sife-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/brand/sife-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,json}"],
        globIgnores: ["repository/**"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/repository\//, /^\/data\//],
        runtimeCaching: [
          {
            urlPattern: /\/data\/repository\.json$/,
            handler: "NetworkFirst",
            options: { cacheName: "sife-catalogo", networkTimeoutSeconds: 4 }
          },
          {
            urlPattern: /\/repository\//,
            handler: "CacheFirst",
            options: {
              cacheName: "sife-documentos",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 60 }
            }
          }
        ]
      }
    })
  ],
  server: { port: 5174 }
});
