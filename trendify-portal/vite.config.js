import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import path from "path";
export default defineConfig({
    base: "/",
    server: {
        port: 3000,
        strictPort: false,
        allowedHosts: ["e6eb6af4ae4e.ngrok-free.app"],
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: "\n          @use \"@/themes/_setup.scss\" as *;\n        ",
            },
        },
    },
    plugins: [react(), tsconfigPaths(), svgr()],
});
