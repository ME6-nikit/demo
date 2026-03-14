const mysql = require("mysql2/promise");
const { mysql: mysqlConfig } = require("../config/env");

const pool = mysql.createPool({
  host: mysqlConfig.host,
  port: mysqlConfig.port,
  user: mysqlConfig.user,
  password: mysqlConfig.password,
  database: mysqlConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
});

async function run(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

async function get(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}

async function all(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function withTransaction(fn) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      order_id VARCHAR(64) NOT NULL UNIQUE,
      order_number VARCHAR(64),
      customer_name VARCHAR(255),
      delivery_date VARCHAR(64),
      delivery_time VARCHAR(64),
      shipping_method VARCHAR(255),
      items_json JSON NOT NULL,
      tags_json JSON NOT NULL,
      is_draft TINYINT(1) NOT NULL DEFAULT 0,
      ignored TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS order_department_status (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      order_id VARCHAR(64) NOT NULL,
      department VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL,
      last_message TEXT,
      updated_at DATETIME NOT NULL,
      UNIQUE KEY ux_order_department (order_id, department)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS order_pdfs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      order_id VARCHAR(64) NOT NULL UNIQUE,
      dm_pdf_path TEXT,
      confectionery_pdf_path TEXT,
      design_pdf_path TEXT,
      updated_at DATETIME NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS printers (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      printer_id VARCHAR(128) NOT NULL UNIQUE,
      printer_name VARCHAR(255) NOT NULL,
      machine_id VARCHAR(128) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'offline',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      assigned_department VARCHAR(32),
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS order_timeline (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      order_id VARCHAR(64) NOT NULL,
      event_type VARCHAR(64) NOT NULL,
      status VARCHAR(32),
      message TEXT NOT NULL,
      timestamp DATETIME NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS print_jobs (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL,
      department VARCHAR(32) NOT NULL,
      pdf_path TEXT NOT NULL,
      printer_id VARCHAR(128) NOT NULL,
      machine_id VARCHAR(128) NOT NULL,
      status VARCHAR(32) NOT NULL,
      error_message TEXT,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )
  `);
}

module.exports = {
  pool,
  initDb,
  run,
  get,
  all,
  withTransaction,
};
