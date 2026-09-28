import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  // Relative asset paths, so dist/ works from any host or subfolder.
  base: "./",
  plugins: [react()],
  // src/kit may be a symlink to the shared arcade kit during development; keep its
  // files addressed under src/ so the dev server serves them.
  resolve: { alias: { "@": path.resolve(__dirname, "./src") }, preserveSymlinks: true },
  server: { host: true, port: 8080 },
});
