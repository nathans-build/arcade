import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  // Relative asset paths, so dist/ works from any host or subfolder (the arcade serves it at /count-carnival/).
  base: "./",
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { host: true, port: 4682 },
});
