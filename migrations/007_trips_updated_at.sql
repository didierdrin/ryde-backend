-- Add updated_at to trips (idempotent)
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing rows
UPDATE trips SET updated_at = COALESCE(end_time, start_time, request_time, created_at)
WHERE updated_at IS NULL;

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
