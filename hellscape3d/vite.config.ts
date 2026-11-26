import { defineConfig } from "vite";

// Pagina di prova del graybox: non pubblicata, la build resta in hellscape3d/dist (ignorata da git).
export default defineConfig({
  base: "./",
  build: { outDir: "dist", emptyOutDir: true, target: "es2022", chunkSizeWarningLimit: 1024 },
  // Le banche di domande della versione precedente stanno fuori dalla cartella del prototipo: si espongono solo quelle.
  server: { host: "127.0.0.1", fs: { allow: [".", "../datasets.json", "../dataset"] } },
  preview: { host: "127.0.0.1" },
});
