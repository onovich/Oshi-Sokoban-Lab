import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { input: { main: 'index.html', waterLab: 'water-lab.html' } } },
  test: {
    exclude: [...configDefaults.exclude, 'experiments/**'],
    environment: 'jsdom',
    globals: true,
  },
});
