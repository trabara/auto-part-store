const { defineConfig } = require("@medusajs/framework/utils");

module.exports = defineConfig({
  admin: {
    disable: true,
  },
  modules: [
    {
      resolve: "./src/modules/authz",
    },
  ],
});
