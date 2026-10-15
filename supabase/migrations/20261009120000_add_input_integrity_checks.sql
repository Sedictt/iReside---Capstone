-- Input integrity CHECK constraints
--
-- Database-level backstop for the validation enforced in the API routes
-- (src/lib/validation). Constraints are added NOT VALID so they apply to new
-- and updated rows without failing on any historical data; run
-- `ALTER TABLE ... VALIDATE CONSTRAINT ...` after cleaning existing rows.

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT * FROM (VALUES
      ('units',            'units_rent_amount_nonnegative',          'rent_amount >= 0'),
      ('units',            'units_beds_nonnegative',                 'beds >= 0'),
      ('units',            'units_baths_nonnegative',                'baths >= 0'),
      ('units',            'units_sqft_positive',                    'sqft IS NULL OR sqft > 0'),
      ('properties',       'properties_total_units_nonnegative',     'total_units IS NULL OR total_units >= 0'),
      ('properties',       'properties_total_floors_nonnegative',    'total_floors IS NULL OR total_floors >= 0'),
      ('properties',       'properties_base_rent_nonnegative',       'base_rent_amount IS NULL OR base_rent_amount >= 0'),
      ('properties',       'properties_renewal_window_nonnegative',  'renewal_window_days >= 0'),
      ('properties',       'properties_advance_months_nonnegative',  'advance_rent_months >= 0'),
      ('properties',       'properties_deposit_months_nonnegative',  'security_deposit_months >= 0'),
      ('leases',           'leases_monthly_rent_nonnegative',        'monthly_rent >= 0'),
      ('leases',           'leases_security_deposit_nonnegative',    'security_deposit >= 0'),
      ('payments',         'payments_amount_nonnegative',            'amount >= 0'),
      ('payments',         'payments_paid_amount_nonnegative',       'paid_amount >= 0'),
      ('payments',         'payments_balance_nonnegative',           'balance_remaining >= 0'),
      ('payments',         'payments_late_fee_nonnegative',          'late_fee_amount >= 0'),
      ('payments',         'payments_period_order',                  'invoice_period_start IS NULL OR invoice_period_end IS NULL OR invoice_period_end >= invoice_period_start'),
      ('amenities',        'amenities_price_nonnegative',            'price_per_unit IS NULL OR price_per_unit >= 0'),
      ('amenities',        'amenities_capacity_positive',            'capacity IS NULL OR capacity > 0'),
      ('amenity_bookings', 'amenity_bookings_time_order',            'end_time > start_time'),
      ('amenity_bookings', 'amenity_bookings_price_nonnegative',     'total_price IS NULL OR total_price >= 0'),
      ('utility_configs',  'utility_configs_rate_nonnegative',       'rate_per_unit >= 0'),
      ('utility_configs',  'utility_configs_effective_order',        'effective_to IS NULL OR effective_to >= effective_from'),
      ('renewal_requests', 'renewal_requests_dates_valid',           'proposed_start_date IS NULL OR proposed_end_date IS NULL OR proposed_end_date > proposed_start_date'),
      ('renewal_requests', 'renewal_requests_rent_nonnegative',      'proposed_monthly_rent IS NULL OR proposed_monthly_rent >= 0'),
      ('renewal_requests', 'renewal_requests_deposit_nonnegative',   'proposed_security_deposit IS NULL OR proposed_security_deposit >= 0'),
      ('move_out_requests','move_out_requests_refund_nonnegative',   'deposit_refund_amount IS NULL OR deposit_refund_amount >= 0')
    ) AS t(tbl, name, expr)
  LOOP
    IF to_regclass('public.' || c.tbl) IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = c.name) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%s) NOT VALID', c.tbl, c.name, c.expr);
    END IF;
  END LOOP;
END $$;
