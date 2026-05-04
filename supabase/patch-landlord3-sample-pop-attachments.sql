-- Patch: Seed sample proof-of-payment attachments for SOME tenants only
-- Landlord scope: 11111111-1111-1111-1111-111111111113
--
-- Before running:
-- 1) Upload file to bucket `payment-proofs` with object path: `demo/gcash-pop.jpg`
-- 2) If your project URL cannot be auto-detected, replace <PROJECT_REF> below.
--
-- Notes:
-- - This intentionally updates only 3 tenants so others still show "no proof attached".
-- - Re-runnable: only targets payments with empty payment_proof_path.

BEGIN;

WITH config AS (
    SELECT
        '11111111-1111-1111-1111-111111111113'::uuid AS landlord_id,
        'demo/gcash-pop.jpg'::text AS proof_path,
        COALESCE(
            (
                SELECT regexp_replace(
                    p.payment_proof_url,
                    '/storage/v1/object/public/payment-proofs/.*$',
                    ''
                )
                FROM public.payments AS p
                WHERE p.payment_proof_url ~ '^https?://.*/storage/v1/object/public/payment-proofs/'
                LIMIT 1
            ),
            'https://<PROJECT_REF>.supabase.co'
        ) AS supabase_base_url
),
candidate_tenants AS (
    SELECT p.tenant_id
    FROM public.payments AS p
    JOIN config AS c
      ON p.landlord_id = c.landlord_id
    WHERE COALESCE(p.payment_proof_path, '') = ''
    GROUP BY p.tenant_id
    ORDER BY MIN(p.created_at)
    LIMIT 3
),
target_payments AS (
    SELECT DISTINCT ON (p.tenant_id)
        p.id,
        p.tenant_id
    FROM public.payments AS p
    JOIN candidate_tenants AS t
      ON t.tenant_id = p.tenant_id
    WHERE COALESCE(p.payment_proof_path, '') = ''
    ORDER BY p.tenant_id, p.due_date DESC NULLS LAST, p.created_at DESC, p.id DESC
),
updated AS (
    UPDATE public.payments AS p
       SET payment_proof_path = c.proof_path,
           payment_proof_url = c.supabase_base_url || '/storage/v1/object/public/payment-proofs/' || c.proof_path,
           payment_submitted_at = COALESCE(p.payment_submitted_at, now()),
           intent_method = COALESCE(p.intent_method, 'gcash'::public.payment_intent_method),
           method = COALESCE(p.method, 'gcash'::public.payment_method),
           reference_number = COALESCE(
               NULLIF(p.reference_number, ''),
               'GCASH-DEMO-' || UPPER(SUBSTRING(REPLACE(p.id::text, '-', '') FROM 1 FOR 8))
           ),
           payment_note = COALESCE(NULLIF(p.payment_note, ''), 'Demo proof attachment (gcash-pop.jpg)'),
           metadata = COALESCE(p.metadata, '{}'::jsonb) || jsonb_build_object(
               'demo_proof_seeded', true,
               'demo_proof_file', 'gcash-pop.jpg'
           ),
           updated_at = now(),
           last_action_at = now()
      FROM target_payments AS tp
      CROSS JOIN config AS c
     WHERE p.id = tp.id
    RETURNING
        p.id,
        p.tenant_id,
        p.invoice_number,
        p.workflow_status,
        p.payment_proof_path,
        p.payment_proof_url
)
SELECT *
FROM updated
ORDER BY tenant_id, id;

COMMIT;

-- Optional quick check after patch:
-- SELECT
--   tenant_id,
--   COUNT(*) FILTER (WHERE COALESCE(payment_proof_path, '') <> '') AS with_pop,
--   COUNT(*) FILTER (WHERE COALESCE(payment_proof_path, '') = '')  AS without_pop
-- FROM public.payments
-- WHERE landlord_id = '11111111-1111-1111-1111-111111111113'
-- GROUP BY tenant_id
-- ORDER BY tenant_id;
