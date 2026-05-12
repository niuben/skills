import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    // copy all files under src/assets into the final build under /assets
    viteStaticCopy({
      targets: [
        {
          src: "src/assets/**/*",
          dest: "assets",
        },
      ],
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:7421",
        changeOrigin: true,
      },
    },
  },
});
