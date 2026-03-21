CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id VARCHAR(64) NOT NULL,
  order_number VARCHAR(64) NOT NULL,
  customer_name VARCHAR(255) NULL,
  order_date DATETIME NULL,
  delivery_date DATE NULL,
  delivery_time VARCHAR(64) NULL,
  specific_delivery_time VARCHAR(64) NULL,
  shipping_method VARCHAR(255) NULL,
  reserved TINYINT(1) NOT NULL DEFAULT 0,
  is_ignored TINYINT(1) NOT NULL DEFAULT 0,
  raw_payload JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orders_shopify_order_id (order_id),
  KEY idx_orders_order_number (order_number),
  KEY idx_orders_order_date (order_date),
  KEY idx_orders_delivery_date (delivery_date),
  KEY idx_orders_is_ignored (is_ignored)
);

CREATE TABLE IF NOT EXISTS order_department_status (
  order_id BIGINT UNSIGNED NOT NULL,
  dm_status ENUM('NA', 'PENDING', 'IN-PROGRESS', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'NA',
  confectionery_status ENUM('NA', 'PENDING', 'IN-PROGRESS', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'NA',
  design_status ENUM('NA', 'PENDING', 'IN-PROGRESS', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'NA',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  CONSTRAINT fk_order_department_status_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_pdfs (
  order_id BIGINT UNSIGNED NOT NULL,
  dm_pdf_path TEXT NULL,
  confectionery_pdf_path TEXT NULL,
  design_pdf_path TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  CONSTRAINT fk_order_pdfs_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS printers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  printer_id VARCHAR(255) NOT NULL,
  printer_name VARCHAR(255) NOT NULL,
  machine_id VARCHAR(255) NOT NULL,
  status VARCHAR(64) NOT NULL DEFAULT 'UNKNOWN',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  metadata JSON NULL,
  last_seen_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_printers_printer_id_machine (printer_id, machine_id),
  KEY idx_printers_machine_id (machine_id)
);

CREATE TABLE IF NOT EXISTS department_printer_assignments (
  department ENUM('DM', 'CONFECTIONERY', 'DESIGN') NOT NULL,
  printer_id VARCHAR(255) NOT NULL,
  machine_id VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (department),
  CONSTRAINT fk_department_assignment_printer
    FOREIGN KEY (printer_id, machine_id) REFERENCES printers (printer_id, machine_id)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS print_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  department ENUM('DM', 'CONFECTIONERY', 'DESIGN') NOT NULL,
  printer_id VARCHAR(255) NOT NULL,
  machine_id VARCHAR(255) NOT NULL,
  pdf_path TEXT NOT NULL,
  job_status ENUM('PENDING', 'IN-PROGRESS', 'SUCCESS', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  error_message TEXT NULL,
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_print_jobs_order_id (order_id),
  KEY idx_print_jobs_status_machine (job_status, machine_id),
  CONSTRAINT fk_print_jobs_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_timeline (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  status VARCHAR(64) NOT NULL,
  department ENUM('DM', 'CONFECTIONERY', 'DESIGN') NULL,
  message TEXT NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_timeline_order_id (order_id),
  KEY idx_order_timeline_event_type (event_type),
  CONSTRAINT fk_order_timeline_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON DELETE CASCADE
);
