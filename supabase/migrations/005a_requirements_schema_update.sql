-- Migration 005a v3: Fix requirements table structure
-- Adds all potentially missing columns

-- Step 1: Add id column if missing
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Step 2: Populate any NULL ids
UPDATE requirements SET id = gen_random_uuid() WHERE id IS NULL;

-- Step 3: Make id NOT NULL
ALTER TABLE requirements ALTER COLUMN id SET NOT NULL;

-- Step 4: Add UNIQUE constraint on id (needed for foreign key references)
ALTER TABLE requirements DROP CONSTRAINT IF EXISTS requirements_id_unique;
ALTER TABLE requirements ADD CONSTRAINT requirements_id_unique UNIQUE (id);

-- Step 5: Add ALL potentially missing columns
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS dis_number TEXT;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS program_id TEXT;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS regulatory_reference TEXT;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS approved_by TEXT;

-- Verify the structure - shows all columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'requirements' AND table_schema = 'public'
ORDER BY ordinal_position;
