import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    // base: "/workers"
    build: {
        chunkSizeWarningLimit: 1600,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        return id.toString().split("node_modules/")[1].split("/")[0].toString();
                    }
                },
            },
        },
    },
    server: {
        proxy: {
            "/api": {
                target: "https://n8n.srv853599.hstgr.cloud",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
            },
            "/spectrum-proxy": {
                target: "https://agentsprod.redtec.ai",
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/spectrum-proxy/, ""),
            },
        },
    },
});
