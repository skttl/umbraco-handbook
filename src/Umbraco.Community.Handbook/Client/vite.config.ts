import { defineConfig } from 'vite';
export default defineConfig({
  base: '/App_Plugins/Handbook/',
  build: {
    lib: { entry: 'src/entrypoint.ts', formats: ['es'], fileName: 'handbook' },
    outDir: '../wwwroot/App_Plugins/Handbook', emptyOutDir: true,
    rollupOptions: { external: [/^@umbraco-cms\//], output: { chunkFileNames: '[name]-[hash].js' } },
  },
});
