-- Extended rental vehicle details for listings and booking

ALTER TABLE rental_vehicles
  ADD COLUMN IF NOT EXISTS pickup_location TEXT,
  ADD COLUMN IF NOT EXISTS daily_rate_with_driver DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS daily_rate_without_driver DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS transmission VARCHAR(20) DEFAULT 'AUTOMATIC',
  ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(20) DEFAULT 'PETROL',
  ADD COLUMN IF NOT EXISTS owner_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS seats INTEGER CHECK (seats IS NULL OR (seats >= 1 AND seats <= 50));

UPDATE rental_vehicles
SET daily_rate_without_driver = daily_rate
WHERE daily_rate_without_driver IS NULL;

UPDATE rental_vehicles
SET daily_rate_with_driver = daily_rate * 1.25
WHERE daily_rate_with_driver IS NULL AND daily_rate IS NOT NULL;

UPDATE rental_vehicles
SET pickup_location = 'Kigali, Rwanda'
WHERE pickup_location IS NULL;

UPDATE rental_vehicles
SET owner_name = 'RYDE Fleet'
WHERE owner_name IS NULL;

UPDATE rental_vehicles
SET seats = 5
WHERE seats IS NULL;

UPDATE rental_vehicles
SET transmission = 'AUTOMATIC'
WHERE transmission IS NULL;

UPDATE rental_vehicles
SET fuel_type = 'PETROL'
WHERE fuel_type IS NULL;
