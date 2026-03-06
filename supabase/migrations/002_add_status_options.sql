-- Add client_logo_url column to dealrooms
ALTER TABLE dealrooms ADD COLUMN IF NOT EXISTS client_logo_url TEXT;

-- Add 'signed' and 'inactive' to the dealroom status CHECK constraint
ALTER TABLE dealrooms DROP CONSTRAINT IF EXISTS dealrooms_status_check;
ALTER TABLE dealrooms ADD CONSTRAINT dealrooms_status_check
  CHECK (status IN ('draft', 'published', 'signed', 'inactive', 'archived'));

-- Update RLS policy to also allow public viewing of 'signed' dealrooms
DROP POLICY IF EXISTS "Public can view published dealrooms by slug" ON dealrooms;
CREATE POLICY "Public can view published or signed dealrooms by slug"
  ON dealrooms FOR SELECT
  USING (status IN ('published', 'signed', 'inactive'));
