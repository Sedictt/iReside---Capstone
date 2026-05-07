UPDATE leases SET 
  landlord_signature = NULL, 
  tenant_signature = NULL, 
  status = 'pending_signature', 
  signed_at = NULL, 
  tenant_signed_at = NULL, 
  landlord_signed_at = NULL, 
  signed_document_url = NULL, 
  signature_lock_version = 0 
WHERE id = '9102c536-4813-4575-9225-c203df2f2926';