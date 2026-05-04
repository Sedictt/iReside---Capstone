-- ============================================================
-- Admin RLS policies (runs after enum value is committed)
-- ============================================================

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "Admins can view all landlord applications"
    ON public.landlord_applications FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "Admins can update landlord applications"
    ON public.landlord_applications FOR UPDATE
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );
