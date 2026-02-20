-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types (idempotent)
DO $$ BEGIN CREATE TYPE user_type_enum AS ENUM ('PASSENGER', 'DRIVER', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE trip_status_enum AS ENUM ('REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_method_enum AS ENUM ('MTN_MOMO', 'AIRTEL_MONEY', 'CASH'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE verification_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE vehicle_type_enum AS ENUM ('SEDAN', 'SUV', 'MOTORCYCLE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE notification_type_enum AS ENUM ('TRIP_REQUEST', 'TRIP_ACCEPTED', 'TRIP_COMPLETED', 'PAYMENT_RECEIVED', 'SYSTEM'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE document_type_enum AS ENUM ('LICENSE', 'INSURANCE', 'REGISTRATION', 'IDENTITY'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE rating_type_enum AS ENUM ('PASSENGER_TO_DRIVER', 'DRIVER_TO_PASSENGER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE subscription_tier_enum AS ENUM ('BASIC', 'PREMIUM', 'ENTERPRISE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE admin_role_enum AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type user_type_enum NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Passengers Table
CREATE TABLE IF NOT EXISTS passengers (
    passenger_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    current_latitude DECIMAL(10,8),
    current_longitude DECIMAL(11,8),
    payment_method VARCHAR(20) DEFAULT 'MTN_MOMO',
    rating DECIMAL(3,2) DEFAULT 5.00 CHECK (rating >= 1.00 AND rating <= 5.00),
    total_trips INTEGER DEFAULT 0 CHECK (total_trips >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    driver_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    license_number VARCHAR(20) UNIQUE NOT NULL,
    current_latitude DECIMAL(10,8),
    current_longitude DECIMAL(11,8),
    is_available BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 5.00 CHECK (rating >= 1.00 AND rating <= 5.00),
    total_trips INTEGER DEFAULT 0 CHECK (total_trips >= 0),
    earnings DECIMAL(12,2) DEFAULT 0.00 CHECK (earnings >= 0),
    verification_status verification_status_enum NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    driver_id VARCHAR(36) UNIQUE NOT NULL REFERENCES drivers(driver_id) ON DELETE CASCADE,
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(20) NOT NULL,
    model VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2030),
    color VARCHAR(15) NOT NULL,
    vehicle_type vehicle_type_enum NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips Table
CREATE TABLE IF NOT EXISTS trips (
    trip_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    passenger_id VARCHAR(36) NOT NULL REFERENCES passengers(passenger_id) ON DELETE CASCADE,
    driver_id VARCHAR(36) REFERENCES drivers(driver_id) ON DELETE SET NULL,
    pickup_latitude DECIMAL(10,8) NOT NULL CHECK (pickup_latitude >= -90 AND pickup_latitude <= 90),
    pickup_longitude DECIMAL(11,8) NOT NULL CHECK (pickup_longitude >= -180 AND pickup_longitude <= 180),
    pickup_address TEXT NOT NULL,
    destination_latitude DECIMAL(10,8) NOT NULL CHECK (destination_latitude >= -90 AND destination_latitude <= 90),
    destination_longitude DECIMAL(11,8) NOT NULL CHECK (destination_longitude >= -180 AND destination_longitude <= 180),
    destination_address TEXT NOT NULL,
    distance DECIMAL(8,2) NOT NULL CHECK (distance > 0),
    duration INTEGER CHECK (duration > 0),
    fare DECIMAL(10,2) NOT NULL CHECK (fare > 0),
    status trip_status_enum NOT NULL DEFAULT 'REQUESTED',
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    payment_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    trip_id VARCHAR(36) UNIQUE NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method payment_method_enum NOT NULL,
    payment_status payment_status_enum NOT NULL DEFAULT 'PENDING',
    transaction_ref VARCHAR(100) UNIQUE,
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    commission DECIMAL(10,2) NOT NULL CHECK (commission >= 0),
    driver_earnings DECIMAL(10,2) NOT NULL CHECK (driver_earnings >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type notification_type_enum NOT NULL,
    delivery_method VARCHAR(20) DEFAULT 'PUSH',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    driver_id VARCHAR(36) NOT NULL REFERENCES drivers(driver_id) ON DELETE CASCADE,
    document_type document_type_enum NOT NULL,
    file_url TEXT NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    verification_status verification_status_enum NOT NULL DEFAULT 'PENDING',
    verified_by VARCHAR(36),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
    rating_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    trip_id VARCHAR(36) NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    rated_by_user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rated_user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    rating_type rating_type_enum NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    driver_id VARCHAR(36) NOT NULL REFERENCES drivers(driver_id) ON DELETE CASCADE,
    tier subscription_tier_enum NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Administrators Table
CREATE TABLE IF NOT EXISTS administrators (
    admin_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role admin_role_enum NOT NULL,
    permissions JSONB DEFAULT '{}',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_passengers_user_id ON passengers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(is_available);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_passenger_id ON trips(passenger_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_payments_trip_id ON payments(trip_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_documents_driver_id ON documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_ratings_trip_id ON ratings(trip_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_driver_id ON subscriptions(driver_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (idempotent: drop then create)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_passengers_updated_at ON passengers;
CREATE TRIGGER update_passengers_updated_at BEFORE UPDATE ON passengers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ratings_updated_at ON ratings;
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_administrators_updated_at ON administrators;
CREATE TRIGGER update_administrators_updated_at BEFORE UPDATE ON administrators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
