const { defineConfig, Modules } = require('@medusajs/utils');

module.exports = defineConfig({
  modules: [
    {
      resolve: './src/modules/rbac',
    },
  ],
});
