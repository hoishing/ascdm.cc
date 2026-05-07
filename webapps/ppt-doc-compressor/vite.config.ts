import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/webapps/ppt-doc-compressor/",
  plugins: [tailwindcss()],
});
