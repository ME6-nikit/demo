const app = require("./app");
const env = require("./config/env");
const { pool } = require("./db/pool");
const { runMigrations } = require("./db/migrate");

async function waitForDatabase(maxRetries = 15, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await pool.getConnection();
      connection.release();
      console.log("Database connection established");
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Could not connect to database after ${maxRetries} attempts: ${error.message}`);
      }
      console.log(`Database not ready, retrying in ${delayMs / 1000}s (attempt ${attempt}/${maxRetries})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function bootstrap() {
  await waitForDatabase();

  if (env.runMigrationsOnBoot) {
    console.log("Running database migrations...");
    await runMigrations();
    console.log("Migrations complete");
  }

  app.listen(env.port, () => {
    console.log(`OMA backend listening on http://localhost:${env.port}`);
    console.log(`Health check: http://localhost:${env.port}/health`);
    console.log(`Webhook endpoint: POST http://localhost:${env.port}/api/shopify/order-webhook`);
  });
}

bootstrap().catch(async (error) => {
  console.error("Failed to bootstrap application:", error.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
