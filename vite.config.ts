import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Build-time base path for assets.
  // - GitHub Pages (project site): "/<repo-name>/"  e.g. /dedouleur.github.io/
  // - GitHub Pages (user site) or VPS: "/"
  //
  // Usage:
  // - VPS / user site:  VITE_BASE_URL=/ npm run build
  // - GitHub project:   VITE_BASE_URL=/dedouleur.github.io/ npm run build  (or use npm run deploy)
  base: process.env.VITE_BASE_URL || "/",
});