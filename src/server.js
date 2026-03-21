const app = require("./app");
const env = require("./config/env");
const { pool } = require("./db/pool");
const { runMigrations } = require("./db/migrate");

async function bootstrap() {
  if (env.runMigrationsOnBoot) {
    await runMigrations();
  }

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`OMA backend listening on port ${env.port}`);
  });
}

bootstrap().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to bootstrap application", error);
  await pool.end();
  process.exit(1);
});
