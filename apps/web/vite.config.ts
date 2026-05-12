import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    // copy all files under src/asset into the final build under /asset
    viteStaticCopy({
      targets: [
        {
          src: "src/asset/**/*",
          dest: "asset",
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
