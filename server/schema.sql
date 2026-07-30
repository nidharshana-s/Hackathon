CREATE TABLE IF NOT EXISTS rental_records (
  equipment_id VARCHAR(20) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  site_id VARCHAR(20),
  check_in TIMESTAMP NOT NULL,
  check_out TIMESTAMP,
  engine_hrs_day NUMERIC(5, 2) NOT NULL,
  idle_hrs_day NUMERIC(5, 2) NOT NULL,
  rental_days INTEGER NOT NULL,
  operator_id VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS rental_notification_log (
  equipment_id VARCHAR(20) NOT NULL REFERENCES rental_records(equipment_id),
  notification_type VARCHAR(50) NOT NULL,
  checkout_date DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (equipment_id, notification_type, checkout_date)
);

-- Existing DBs: allow null check_out (means currently checked in) and store time.
ALTER TABLE rental_records
  ALTER COLUMN check_in TYPE TIMESTAMP USING check_in::timestamp;

ALTER TABLE rental_records
  ALTER COLUMN check_out TYPE TIMESTAMP USING check_out::timestamp;

ALTER TABLE rental_records
  ALTER COLUMN check_out DROP NOT NULL;

INSERT INTO rental_records (
  equipment_id, type, site_id, check_in, check_out, engine_hrs_day, idle_hrs_day, rental_days, operator_id
)
VALUES
  ('EQX1001', 'Excavator', 'S003', '2025-04-01', '2025-04-16', 1.5, 10, 15, 'OP101'),
  ('EQX1002', 'Crane', NULL, '2025-03-10', '2025-03-30', 0, 11, 20, NULL),
  ('EQX1003', 'Bulldozer', 'S002', '2025-02-15', '2025-03-11', 7.5, 0.5, 25, 'OP203'),
  ('EQX1004', 'Excavator', 'S004', '2025-05-05', '2025-05-15', 2, 9, 10, 'OP106'),
  ('EQX1005', 'Bulldozer', 'S006', '2025-01-01', '2025-01-31', 8, 0, 30, 'OP301'),
  ('EQX1006', 'Grader', 'S001', '2025-04-05', '2025-04-23', 3, 6, 18, 'OP114'),
  ('EQX1007', 'Excavator', NULL, '2025-03-20', '2025-04-01', 0, 12, 12, NULL)
ON CONFLICT (equipment_id) DO NOTHING;
