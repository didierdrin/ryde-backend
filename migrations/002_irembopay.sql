-- IremboPay: store invoice numbers for webhook matching; rental intents for non-trip payments

ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_invoice_number ON payments (invoice_number) WHERE invoice_number IS NOT NULL;

DO $$ BEGIN
  ALTER TYPE payment_method_enum ADD VALUE 'IREMBO_PAY';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS rental_payment_intents (
    intent_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    invoice_number VARCHAR(255) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    vehicle_ref VARCHAR(64),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rental_intents_user ON rental_payment_intents (user_id);
CREATE INDEX IF NOT EXISTS idx_rental_intents_invoice ON rental_payment_intents (invoice_number) WHERE invoice_number IS NOT NULL;
