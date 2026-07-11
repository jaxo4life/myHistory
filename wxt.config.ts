import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'myHistory',
    description: 'Open-source, fully local, auditable browsing history manager',
    version: '0.1.3',
    action: {
      default_title: 'myHistory',
    },
    permissions: ['webNavigation', 'tabs', 'history', 'storage', 'contextMenus'],
    host_permissions: ['<all_urls>'],
  },
});
