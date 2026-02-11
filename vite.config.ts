import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages base path for:
// https://chipgptbiz.github.io/tech-literacy-workshop/
const base = "/tech-literacy-workshop/";

export default defineConfig({
  base,
  plugins: [react()],
});
