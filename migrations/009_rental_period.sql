-- Rental booking period on payment intents (one vehicle, one active booking per period)

ALTER TABLE rental_payment_intents
  ADD COLUMN IF NOT EXISTS rental_start_date DATE,
  ADD COLUMN IF NOT EXISTS rental_end_date DATE,
  ADD COLUMN IF NOT EXISTS rental_days INT,
  ADD COLUMN IF NOT EXISTS with_driver BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_rental_intents_vehicle_period
  ON rental_payment_intents (vehicle_ref, rental_start_date, rental_end_date)
  WHERE vehicle_ref IS NOT NULL AND status IN ('PENDING', 'COMPLETED');
