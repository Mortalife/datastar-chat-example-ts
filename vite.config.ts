import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    build: {
      manifest: true,
      rollupOptions: {
        input: "./src/client.ts",
        output: {
          dir: "./dist/static",
          entryFileNames: "assets/client.js",
        },
      },
      copyPublicDir: false,
    },
  };
});
