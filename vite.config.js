import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Troque "onirica" abaixo pelo nome exato do seu repositório no GitHub,
// isso é necessário para o GitHub Pages encontrar os arquivos corretamente.
export default defineConfig({
  plugins: [react()],
  base: "/onirica/",
});
