-- OMA dummy rows for MySQL 8
-- Covers: orders, order_department_status, order_pdfs, printers, order_timeline
-- Scenarios:
-- 900001 => Default rule (all departments printable)
-- 900002 => Designer cake tag (Design = NA)
-- 900003 => Additional Customization Charges (all departments printable)

START TRANSACTION;

-- 1) Printers (assigned to departments)
INSERT INTO printers (
  printer_id,
  printer_name,
  machine_id,
  status,
  is_active,
  assigned_department,
  created_at,
  updated_at
)
VALUES
  ('PRN-DM-001', 'Epson TM-T88', 'M-OMA-01', 'online', 1, 'DM', '2026-03-14 09:00:00', '2026-03-14 09:00:00'),
  ('PRN-CF-001', 'HP LaserJet M404', 'M-OMA-01', 'online', 1, 'Confectionery', '2026-03-14 09:00:00', '2026-03-14 09:00:00'),
  ('PRN-DS-001', 'Canon LBP2900', 'M-OMA-01', 'online', 1, 'Design', '2026-03-14 09:00:00', '2026-03-14 09:00:00')
ON DUPLICATE KEY UPDATE
  printer_name = VALUES(printer_name),
  machine_id = VALUES(machine_id),
  status = VALUES(status),
  is_active = VALUES(is_active),
  assigned_department = VALUES(assigned_department),
  updated_at = VALUES(updated_at);

-- 2) Orders
INSERT INTO orders (
  order_id,
  order_number,
  customer_name,
  delivery_date,
  delivery_time,
  shipping_method,
  items_json,
  tags_json,
  is_draft,
  ignored,
  created_at,
  updated_at
)
VALUES
  (
    '900001',
    'OMA-1001',
    'Aarav Kapoor',
    '2026-03-20',
    '18:30-19:00',
    'Standard Delivery',
    JSON_ARRAY(
      JSON_OBJECT('sku', 'CK-CHOC-1KG', 'title', 'Chocolate Truffle Cake 1kg', 'quantity', 1, 'price', 1299.00),
      JSON_OBJECT('sku', 'ACC-CANDLES', 'title', 'Birthday Candles Set', 'quantity', 1, 'price', 99.00)
    ),
    JSON_ARRAY('ONLINE', 'OMA-TEST-DEFAULT'),
    0,
    0,
    '2026-03-14 09:05:00',
    '2026-03-14 09:20:00'
  ),
  (
    '900002',
    'OMA-1002',
    'Sana Mehta',
    '2026-03-21',
    '10:00-10:30',
    'Express Delivery',
    JSON_ARRAY(
      JSON_OBJECT('sku', 'CK-REDVEL-2KG', 'title', 'Red Velvet Designer Cake 2kg', 'quantity', 1, 'price', 2399.00)
    ),
    JSON_ARRAY('ORDER-MANAGEMENT-AUTOMATION-DESIGNER-CAKE', 'OMA-TEST-DESIGNER'),
    0,
    0,
    '2026-03-14 09:10:00',
    '2026-03-14 09:24:00'
  ),
  (
    '900003',
    'OMA-1003',
    'Rohan Bedi',
    '2026-03-22',
    '16:00-16:30',
    'Standard Delivery',
    JSON_ARRAY(
      JSON_OBJECT('sku', 'CK-BLACKFOREST-1.5KG', 'title', 'Black Forest Cake 1.5kg', 'quantity', 1, 'price', 1599.00),
      JSON_OBJECT('sku', 'ADD-CUSTOM-CHARGE', 'title', 'Additional Customization Charges', 'quantity', 1, 'price', 300.00)
    ),
    JSON_ARRAY('OMA-TEST-CUSTOMIZATION'),
    0,
    0,
    '2026-03-14 09:15:00',
    '2026-03-14 09:28:00'
  )
ON DUPLICATE KEY UPDATE
  order_number = VALUES(order_number),
  customer_name = VALUES(customer_name),
  delivery_date = VALUES(delivery_date),
  delivery_time = VALUES(delivery_time),
  shipping_method = VALUES(shipping_method),
  items_json = VALUES(items_json),
  tags_json = VALUES(tags_json),
  is_draft = VALUES(is_draft),
  ignored = VALUES(ignored),
  updated_at = VALUES(updated_at);

-- 3) Order Department Status
INSERT INTO order_department_status (
  order_id,
  department,
  status,
  last_message,
  updated_at
)
VALUES
  -- 900001: default rule => all departments printable
  ('900001', 'DM', 'Success', 'Printed successfully on PRN-DM-001', '2026-03-14 09:20:00'),
  ('900001', 'Confectionery', 'In-Progress', 'Desktop picked print job', '2026-03-14 09:20:00'),
  ('900001', 'Design', 'Pending', 'Awaiting print queue', '2026-03-14 09:20:00'),

  -- 900002: designer cake => Design is NA
  ('900002', 'DM', 'Success', 'Printed successfully on PRN-DM-001', '2026-03-14 09:24:00'),
  ('900002', 'Confectionery', 'Success', 'Printed successfully on PRN-CF-001', '2026-03-14 09:24:00'),
  ('900002', 'Design', 'NA', 'Designer cake rule matched', '2026-03-14 09:24:00'),

  -- 900003: customization charge => all departments printable
  ('900003', 'DM', 'Failure', 'Printer timeout while printing', '2026-03-14 09:28:00'),
  ('900003', 'Confectionery', 'Pending', 'Awaiting print queue', '2026-03-14 09:28:00'),
  ('900003', 'Design', 'In-Progress', 'Desktop picked print job', '2026-03-14 09:28:00')
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  last_message = VALUES(last_message),
  updated_at = VALUES(updated_at);

-- 4) Order PDF paths
INSERT INTO order_pdfs (
  order_id,
  dm_pdf_path,
  confectionery_pdf_path,
  design_pdf_path,
  updated_at
)
VALUES
  (
    '900001',
    '/workspace/backend/storage/pdfs/900001/900001-dm-1710408000000.pdf',
    '/workspace/backend/storage/pdfs/900001/900001-confectionery-1710408001000.pdf',
    '/workspace/backend/storage/pdfs/900001/900001-design-1710408002000.pdf',
    '2026-03-14 09:20:00'
  ),
  (
    '900002',
    '/workspace/backend/storage/pdfs/900002/900002-dm-1710408240000.pdf',
    '/workspace/backend/storage/pdfs/900002/900002-confectionery-1710408241000.pdf',
    NULL,
    '2026-03-14 09:24:00'
  ),
  (
    '900003',
    '/workspace/backend/storage/pdfs/900003/900003-dm-1710408480000.pdf',
    '/workspace/backend/storage/pdfs/900003/900003-confectionery-1710408481000.pdf',
    '/workspace/backend/storage/pdfs/900003/900003-design-1710408482000.pdf',
    '2026-03-14 09:28:00'
  )
ON DUPLICATE KEY UPDATE
  dm_pdf_path = VALUES(dm_pdf_path),
  confectionery_pdf_path = VALUES(confectionery_pdf_path),
  design_pdf_path = VALUES(design_pdf_path),
  updated_at = VALUES(updated_at);

-- 5) Timeline events
INSERT INTO order_timeline (
  order_id,
  event_type,
  status,
  message,
  timestamp
)
VALUES
  ('900001', 'ORDER_RECEIVED', 'Success', 'Shopify webhook received', '2026-03-14 09:05:02'),
  ('900001', 'RULE_EVALUATED', 'Success', 'Rule 6 matched: Default', '2026-03-14 09:05:03'),
  ('900001', 'PDF_GENERATED', 'Success', 'Department PDFs generated and stored', '2026-03-14 09:05:07'),
  ('900001', 'PRINT_JOB_QUEUED', 'Pending', 'DM: Print job queued for printer Epson TM-T88', '2026-03-14 09:05:08'),
  ('900001', 'PRINT_COMPLETED', 'Success', 'DM: Printed successfully on PRN-DM-001', '2026-03-14 09:20:00'),

  ('900002', 'ORDER_RECEIVED', 'Success', 'Shopify webhook received', '2026-03-14 09:10:02'),
  ('900002', 'RULE_EVALUATED', 'Success', 'Rule 5 matched: Designer cake', '2026-03-14 09:10:03'),
  ('900002', 'PDF_GENERATED', 'Success', 'DM + Confectionery PDFs generated; Design skipped (NA)', '2026-03-14 09:10:06'),
  ('900002', 'PRINT_COMPLETED', 'Success', 'Confectionery: Printed successfully on PRN-CF-001', '2026-03-14 09:24:00'),

  ('900003', 'ORDER_RECEIVED', 'Success', 'Shopify webhook received', '2026-03-14 09:15:02'),
  ('900003', 'RULE_EVALUATED', 'Success', 'Rule 2 matched: Additional Customization Charges', '2026-03-14 09:15:03'),
  ('900003', 'PDF_GENERATED', 'Success', 'Department PDFs generated and stored', '2026-03-14 09:15:06'),
  ('900003', 'PRINT_FAILED', 'Failure', 'DM: Printer timeout while printing', '2026-03-14 09:28:00')
;

COMMIT;
