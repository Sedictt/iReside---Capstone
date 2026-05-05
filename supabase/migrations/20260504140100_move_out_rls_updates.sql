-- Add policy for tenants to update their own move-out requests (for checklist)
CREATE POLICY "Tenants can update own move-out requests"
  ON move_out_requests FOR UPDATE
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());
