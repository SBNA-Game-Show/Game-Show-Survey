const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",

    env: {
      DB_NAME: "Data_Jimmy_Test",
    },

    setupNodeEvents(on, config) {
      // Force backend DB name for all Cypress runs
      process.env.DB_NAME = "Data_Jimmy_Test";

      return config;
    },
  },
});
