import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// GitHub Pages hosts this project under /ayodele-law-firm/.
// Netlify and custom-domain deployments serve from the domain root.
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  base: isGitHubPages ? '/ayodele-law-firm/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
