import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/maskable-512.png",
      ],
      manifest: {
        id: "/",
        name: "Mural dos Sonhos",
        short_name: "Meus Sonhos",
        description:
          "Monte seu mural de sonhos com fotos, frases, figurinhas, templates e um modo livre.",
        lang: "pt-BR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        prefer_related_applications: false,
        background_color: "#faf8f4",
        theme_color: "#61506e",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webp,woff2}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
