const fs = require("fs/promises");
const path = require("path");
const { pool } = require("./pool");

const MIGRATIONS_DIR = path.resolve(__dirname, "migrations");

async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(connection) {
  const [rows] = await connection.query("SELECT version FROM schema_migrations");
  return new Set(rows.map((row) => row.version));
}

async function runMigrations() {
  const connection = await pool.getConnection();
  try {
    await ensureMigrationsTable(connection);
    const applied = await getAppliedMigrations(connection);

    const files = (await fs.readdir(MIGRATIONS_DIR))
      .filter((fileName) => fileName.endsWith(".sql"))
      .sort();

    for (const fileName of files) {
      if (applied.has(fileName)) {
        continue;
      }

      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, fileName), "utf8");
      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.query("INSERT INTO schema_migrations (version) VALUES (?)", [fileName]);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      // eslint-disable-next-line no-console
      console.error("Migration failed", error);
      await pool.end();
      process.exit(1);
    });
}

module.exports = {
  runMigrations,
};
