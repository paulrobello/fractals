import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag', '**/*.vs', '**/*.fs'],
      compress: false,
      watch: true,
      defaultExtension: 'glsl',
    }),
  ],
  server: {
    port: 3333,
    open: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          monaco: ['monaco-editor'],
        },
      },
    },
  },
});
