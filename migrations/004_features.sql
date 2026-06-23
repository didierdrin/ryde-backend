-- Rentals, auctions, mechanics, and extended driver profile fields

DO $$ BEGIN CREATE TYPE auction_listing_type_enum AS ENUM ('BUY', 'SELL'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE auction_status_enum AS ENUM ('ACTIVE', 'SOLD', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS license_issued_date DATE;

CREATE TABLE IF NOT EXISTS rental_vehicles (
    rental_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2035),
    color VARCHAR(30) NOT NULL,
    vehicle_type vehicle_type_enum NOT NULL DEFAULT 'SEDAN',
    daily_rate DECIMAL(12,2) NOT NULL CHECK (daily_rate > 0),
    image_url TEXT NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(36) REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auction_listings (
    listing_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    listing_type auction_listing_type_enum NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    make VARCHAR(50),
    model VARCHAR(50),
    year INTEGER CHECK (year IS NULL OR (year >= 1990 AND year <= 2035)),
    price DECIMAL(12,2) NOT NULL CHECK (price > 0),
    image_url TEXT,
    status auction_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanics (
    mechanic_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    phone_number VARCHAR(20),
    specialty VARCHAR(100),
    rating DECIMAL(3,2) DEFAULT 4.50 CHECK (rating >= 1.00 AND rating <= 5.00),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rental_vehicles_available ON rental_vehicles(is_available);
CREATE INDEX IF NOT EXISTS idx_auction_listings_type ON auction_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_auction_listings_status ON auction_listings(status);
CREATE INDEX IF NOT EXISTS idx_mechanics_active ON mechanics(is_active);

DROP TRIGGER IF EXISTS update_rental_vehicles_updated_at ON rental_vehicles;
CREATE TRIGGER update_rental_vehicles_updated_at BEFORE UPDATE ON rental_vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_auction_listings_updated_at ON auction_listings;
CREATE TRIGGER update_auction_listings_updated_at BEFORE UPDATE ON auction_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mechanics_updated_at ON mechanics;
CREATE TRIGGER update_mechanics_updated_at BEFORE UPDATE ON mechanics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed rental vehicles with images (idempotent)
INSERT INTO rental_vehicles (rental_id, make, model, year, color, vehicle_type, daily_rate, image_url, description)
SELECT v.rental_id, v.make, v.model, v.year, v.color, v.vehicle_type::vehicle_type_enum, v.daily_rate, v.image_url, v.description
FROM (VALUES
    ('rental-seed-001', 'Toyota', 'RAV4', 2022, 'White', 'SUV', 35000,
     'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
     'Spacious SUV ideal for family trips around Kigali.'),
    ('rental-seed-002', 'Honda', 'CR-V', 2021, 'Silver', 'SUV', 32000,
     'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
     'Comfortable crossover with great fuel economy.'),
    ('rental-seed-003', 'Toyota', 'Corolla', 2023, 'Black', 'SEDAN', 25000,
     'https://images.unsplash.com/photo-1623869675781-40aa4e5d41dd?w=800&q=80',
     'Reliable sedan for city driving and short trips.')
) AS v(rental_id, make, model, year, color, vehicle_type, daily_rate, image_url, description)
WHERE NOT EXISTS (SELECT 1 FROM rental_vehicles LIMIT 1);

-- Seed mechanics near Kigali (idempotent)
INSERT INTO mechanics (mechanic_id, name, address, latitude, longitude, phone_number, specialty, rating)
SELECT m.mechanic_id, m.name, m.address, m.latitude, m.longitude, m.phone_number, m.specialty, m.rating
FROM (VALUES
    ('mech-seed-001', 'Kigali Auto Care', 'KG 7 Ave, Kigali', -1.94410000, 30.06190000, '+250788123456', 'General repair', 4.80),
    ('mech-seed-002', 'Nyabugogo Motors', 'Nyabugogo, Kigali', -1.93950000, 30.04440000, '+250788234567', 'Engine & transmission', 4.60),
    ('mech-seed-003', 'Remera Quick Fix', 'Remera, Kigali', -1.95060000, 30.10450000, '+250788345678', 'Tires & brakes', 4.70)
) AS m(mechanic_id, name, address, latitude, longitude, phone_number, specialty, rating)
WHERE NOT EXISTS (SELECT 1 FROM mechanics LIMIT 1);
