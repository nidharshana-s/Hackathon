CREATE TABLE IF NOT EXISTS operators (
  operator_id VARCHAR(20) PRIMARY KEY,
  password VARCHAR(255) NOT NULL DEFAULT '1234'
);

INSERT INTO operators (operator_id, password)
VALUES
  ('OP101', '1234'),
  ('OP203', '1234'),
  ('OP106', '1234'),
  ('OP301', '1234'),
  ('OP114', '1234')
ON CONFLICT (operator_id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_rental_operator'
  ) THEN
    ALTER TABLE rental_records
      ADD CONSTRAINT fk_rental_operator
      FOREIGN KEY (operator_id)
      REFERENCES operators(operator_id);
  END IF;
END $$;

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
