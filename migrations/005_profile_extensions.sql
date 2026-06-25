-- Profile pictures, driver/passenger extended fields, vehicle image

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS years_experience INTEGER CHECK (years_experience IS NULL OR years_experience >= 0),
  ADD COLUMN IF NOT EXISTS license_document_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE passengers
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS image_url TEXT;
