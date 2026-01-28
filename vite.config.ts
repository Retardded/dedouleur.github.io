import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Build-time base path for assets.
  // - GitHub Pages: "/<repo>/"
  // - VPS / custom domain: "/"
  //
  // Usage:
  // - VPS:        VITE_BASE_URL=/ npm run build
  // - GitHub:     VITE_BASE_URL=/dedouleur.github.io/ npm run build
  base: process.env.VITE_BASE_URL || "/",
});