import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // YouTube metadata via yt-dlp can take 30–60s; default proxy timeouts feel like a "stuck" UI.
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        timeout: 120_000,
        proxyTimeout: 120_000,
      },
    },
  },
});
