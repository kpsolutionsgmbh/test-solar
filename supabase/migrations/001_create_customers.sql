-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID        NOT NULL,
  salutation      TEXT        DEFAULT 'Herr' CHECK (salutation IN ('Herr', 'Frau')),
  first_name      TEXT        NOT NULL,
  last_name       TEXT        NOT NULL,
  company         TEXT        NOT NULL,
  position        TEXT,
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  logo_url        TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Add customer_id to dealrooms
ALTER TABLE dealrooms ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only see their own customers
CREATE POLICY "Users can manage own customers" ON customers
  FOR ALL USING (admin_id = auth.uid());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_customers_admin_id ON customers(admin_id);
CREATE INDEX IF NOT EXISTS idx_dealrooms_customer_id ON dealrooms(customer_id);
