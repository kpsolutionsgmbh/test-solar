-- Add solar-specific fields to dealrooms table

-- Customer type: private (Privatkunde) or commercial (Gewerbekunde)
ALTER TABLE dealrooms ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'private'
  CHECK (customer_type IN ('private', 'commercial'));

-- Calculator data: stores solar calculator inputs/outputs as JSON
ALTER TABLE dealrooms ADD COLUMN IF NOT EXISTS calculator_data JSONB;

-- Offers data: stores solar offer packages as JSON
ALTER TABLE dealrooms ADD COLUMN IF NOT EXISTS offers_data JSONB;

-- Update brand_color default to Solar Orange
ALTER TABLE admin_users ALTER COLUMN brand_color SET DEFAULT '#E97E1C';

-- Add comment for documentation
COMMENT ON COLUMN dealrooms.customer_type IS 'Customer type: private (residential) or commercial (business)';
COMMENT ON COLUMN dealrooms.calculator_data IS 'Solar calculator data: consumption, price, system size, savings, etc.';
COMMENT ON COLUMN dealrooms.offers_data IS 'Solar offer packages: basis, comfort, premium with prices and features';
