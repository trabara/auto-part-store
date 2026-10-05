// Integration suites: drop the worker's temp database once its tests finish.
const { dropDatabase } = require("pg-god");

afterAll(async () => {
  try {
    await dropDatabase(
      { databaseName: process.env.DB_TEMP_NAME },
      {
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
      },
    );
  } catch (error) {
    console.error(`Could not drop ${process.env.DB_TEMP_NAME}: ${error.message}`);
  }
});
