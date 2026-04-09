-- Add service_type to trips (idempotent)
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS service_type TEXT NOT NULL DEFAULT 'Taxi/Cab';

-- Optional: basic constraint to avoid empty values
DO $$ BEGIN
  ALTER TABLE trips
    ADD CONSTRAINT trips_service_type_not_empty CHECK (length(trim(service_type)) > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

