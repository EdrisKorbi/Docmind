import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // Enables the JSX transform and React Fast Refresh (instant UI updates while coding)
  plugins: [react()],
  server: {
    // Must match the origin allowed in the backend's ALLOWED_ORIGINS (CORS)
    port: 5173,
    // Fail loudly if 5173 is busy, instead of silently moving to 5174 (CORS would block it)
    strictPort: true,
  },
});