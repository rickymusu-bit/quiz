import { defineConfig } from "vite";

// Pagina di prova del graybox: non pubblicata, la build resta in hellscape3d/dist (ignorata da git).
export default defineConfig({
  base: "./",
  build: { outDir: "dist", emptyOutDir: true, target: "es2022", chunkSizeWarningLimit: 1024 },
  server: { host: "127.0.0.1" },
  preview: { host: "127.0.0.1" },
});
