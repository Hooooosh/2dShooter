import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: "./",
	build: {
		target: "esnext",
		outDir: "./dist",
		emptyOutDir: true,
		minify: "esbuild",
		sourcemap: false,
	},
	base: "/",
});
