-- Patch to update existing receipt notifications to high-fidelity embedded invoices
-- Target: Landlord 3's payment scenarios and the new Elena Gilbert seed

BEGIN;

-- 1) Update Elena Gilbert's receipt message
UPDATE public.messages
SET 
  content = 'Your digital receipt for February 2026 rent has been generated.',
  metadata = jsonb_build_object(
    'systemType', 'invoice',
    'invoiceId', 'REC-L3-ELENA-001',
    'tenantName', 'Elena Gilbert',
    'unitName', 'Studio 101',
    'amount', '9,000',
    'date', 'Feb 5, 2026',
    'description', 'Monthly Rent - February 2026',
    'paymentId', 'd3d30000-0000-0000-0000-000000000050',
    'workflowStatus', 'receipted'
  )
WHERE id = '6c6c0000-0000-0000-0000-000000000050';

-- 2) Update Rhea Bautista's receipt message
UPDATE public.messages
SET 
  content = 'Your digital receipt for invoice INV-L3-RECEIPTED-202602-05 has been generated.',
  metadata = jsonb_build_object(
    'systemType', 'invoice',
    'invoiceId', 'INV-L3-RECEIPTED-202602-05',
    'tenantName', 'Rhea Bautista',
    'unitName', 'Studio 202',
    'amount', '9,600',
    'date', 'Feb 15, 2026',
    'description', 'Monthly Rent + Electricity',
    'paymentId', 'd3d30000-0000-0000-0000-000000000005',
    'workflowStatus', 'receipted'
  )
WHERE id = '6c6c0000-0000-0000-0000-000000000003';

-- 3) Update Paolo Lim's receipt message
UPDATE public.messages
SET 
  content = 'Your digital receipt for in-person payment INV-L3-RECEIPTED-CASH-202602-12 has been generated.',
  metadata = jsonb_build_object(
    'systemType', 'invoice',
    'invoiceId', 'INV-L3-RECEIPTED-CASH-202602-12',
    'tenantName', 'Paolo Lim',
    'unitName', 'Villa 1',
    'amount', '26,500',
    'date', 'Feb 1, 2026',
    'description', 'Monthly Rent + Utilities',
    'paymentId', 'd3d30000-0000-0000-0000-00000000000c',
    'workflowStatus', 'receipted'
  )
WHERE id = '6c6c0000-0000-0000-0000-00000000000a';

COMMIT;
