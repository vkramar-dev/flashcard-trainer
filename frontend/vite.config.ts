import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

/**
 * Pure client-side SPA build.
 *
 * The dev server proxies /api to the standalone Express mock API so that the
 * frontend always talks to a real HTTP backend during development.
 * The production build is static HTML/CSS/JS only and never needs Node.js.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  server: {
    host: true,
    port: 3000,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: process.env.MOCK_API_URL ?? "http://127.0.0.1:4000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 3000,
  },
})
