import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import styleX from "@stylexjs/unplugin";

export default defineConfig({
  plugins: [
    styleX.vite({
      useCSSLayers: true,
    }),
    preact(),
  ],
  build: {
    outDir: "dist",
  },
});
