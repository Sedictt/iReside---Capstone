-- Normalize payment defaults: add explicit advance_rent_months and security_deposit_months columns
-- to properties table, migrated from contract_template JSON field.
--
-- This replaces the need to parse contract_template JSON every time we need these values.

-- Step 1: Add columns with defaults (safe - nullable with sensible defaults)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS advance_rent_months integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS security_deposit_months integer DEFAULT 2;

-- Step 2: Migrate existing contract_template values
-- For properties that have contract_template with advance_rent or security_deposit keys,
-- parse them and update the new columns.
--
-- contract_template typically stores values like "1 month", "2 months", or just "1", "2"

-- Migration for advance_rent_months
UPDATE properties p
SET advance_rent_months = parsed.advance_months
FROM (
    SELECT
        id,
        -- Extract number from strings like "1 month", "2 months", "1", "2 months advance"
        COALESCE(
            NULLIF(REGEXP_REPLACE(
                COALESCE(
                    contract_template->>'advance_rent',
                    contract_template->>'advance',
                    contract_template->>'advance_amount',
                    contract_template->>'advance_payment'
                ) :: text,
                '[^0-9]', '', 'g'
            ), '')::int,
            1  -- default to 1 month
        ) as advance_months
    FROM properties
    WHERE contract_template IS NOT NULL
) as parsed
WHERE parsed.id = p.id;

-- Migration for security_deposit_months
UPDATE properties p
SET security_deposit_months = parsed.deposit_months
FROM (
    SELECT
        id,
        -- Extract number from strings like "2 months", "1 month", "2", "security_deposit": "2 months"
        COALESCE(
            NULLIF(REGEXP_REPLACE(
                COALESCE(
                    contract_template->>'security_deposit',
                    contract_template->>'deposit',
                    contract_template->>'security_deposit_amount'
                ) :: text,
                '[^0-9]', '', 'g'
            ), '')::int,
            2  -- default to 2 months
        ) as deposit_months
    FROM properties
    WHERE contract_template IS NOT NULL
) as parsed
WHERE parsed.id = p.id;

-- Step 3: Verify the migration
-- SELECT
--     id,
--     name,
--     advance_rent_months,
--     security_deposit_months,
--     contract_template->>'advance_rent' as advance_rent_template,
--     contract_template->>'security_deposit' as security_deposit_template
-- FROM properties
-- WHERE advance_rent_months != 1 OR security_deposit_months != 2;

-- Step 4: Add NOT NULL constraint now that all rows have valid values
ALTER TABLE properties
ALTER COLUMN advance_rent_months SET NOT NULL,
ALTER COLUMN security_deposit_months SET NOT NULL;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN properties.advance_rent_months IS 'Number of months advance rent required (typically 1 month)';
COMMENT ON COLUMN properties.security_deposit_months IS 'Number of months security deposit (typically 2 months)';