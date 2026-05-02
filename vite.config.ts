import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import fs from 'fs';

const manifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf-8'));

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        options: 'options.html',
        popup: 'popup.html',
      },
    },
  },
});
