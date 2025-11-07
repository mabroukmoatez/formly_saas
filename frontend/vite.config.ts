import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: "./public",
  base: "./",
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Handle all API routes - proxy to backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          console.log('Proxying /api to http://localhost:8000');
        }
      },
      // Handle organization API routes - remove organization prefix
      '/organization/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          const newPath = path.replace(/^\/organization/, '');
          console.log(`Rewriting ${path} to ${newPath}`);
          return newPath;
        },
        configure: (proxy, options) => {
          console.log('Proxying /organization/api to http://localhost:8000');
        }
      },
      // Handle subdomain organization API routes - remove subdomain and organization prefix
      '/edufirma/organization/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          const newPath = path.replace(/^\/edufirma\/organization/, '');
          console.log(`Rewriting ${path} to ${newPath}`);
          return newPath;
        },
        configure: (proxy, options) => {
          console.log('Proxying /edufirma/organization/api to http://localhost:8000');
        }
      },
      // Handle uploads
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
