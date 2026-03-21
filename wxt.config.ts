import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  vite: () => ({
    plugins: [tailwindcss() as unknown as Plugin],
  }),

  manifest: {
    name: '快捷标签',
    permissions: ['storage', 'tabs'],
    host_permissions: [
      'https://www.google.com/*',
      'https://*.google.com/*',
      'https://*.gstatic.com/*',
      'https://favicon.im/*',
    ],
  },
});
