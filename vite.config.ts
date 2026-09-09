import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { input: { main: 'index.html', waterLab: 'water-lab.html' } } },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
