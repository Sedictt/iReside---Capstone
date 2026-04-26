-- Patch: Add avatar_url and avatar_bg_color for all seed tenants using iReside default avatars
-- This ensures tenants in the unit sidebar show proper profile pictures with colored backgrounds

BEGIN;

-- Avatar bucket URL
DO $$
DECLARE
    BUCKET_URL TEXT := 'https://hlpgsiqyrtndqdgvttcr.supabase.co/storage/v1/object/public/profile-avatars/default_avatars/';
BEGIN
    -- =============================================
    -- LANDLORD 11111111-1111-1111-1111-111111111111 (Marina Reyes)
    -- Properties: Maple Grove Residences, Skyline Lofts
    -- =============================================

    -- Maple Grove tenants
    -- Ariana Cruz (33333333-3333-3333-3333-333333333333) - Unit 2A
    UPDATE public.profiles
    SET avatar_url = BUCKET_URL || '3.png', avatar_bg_color = '#0D9488'
    WHERE id = '33333333-3333-3333-3333-333333333333';

    -- Noah Villanueva (44444444-4444-4444-4444-444444444444) - also has lease at Downtown Apt (landlord 4)
    UPDATE public.profiles
    SET avatar_url = BUCKET_URL || '7.png', avatar_bg_color = '#6366F1'
    WHERE id = '44444444-4444-4444-4444-444444444444';

    -- Skyline Lofts tenants (walkthrough-v2 patch)
    -- Mika Torres (33333333-3333-3333-3333-333333333351) - Loft 1A
    UPDATE public.profiles
    SET avatar_url = BUCKET_URL || '4.png', avatar_bg_color = '#14B8A6'
    WHERE id = '33333333-3333-3333-3333-333333333351';

    -- Neil Garcia (33333333-3333-3333-3333-333333333352) - Loft 1D
    UPDATE public.profiles
    SET avatar_url = BUCKET_URL || '8.png', avatar_bg_color = '#8B5CF6'
    WHERE id = '33333333-3333-3333-3333-333333333352';

    -- Ivy Santos (33333333-3333-3333-3333-333333333353) - Loft 2A
    UPDATE public.profiles
    SET avatar_url = BUCKET_URL || '10.png', avatar_bg_color = '#EC4899'
    WHERE id = '33333333-3333-3333-3333-333333333353';

    -- Ralph Cruz (33333333-3333-3333-3333-333333333354) - Loft 2C
    UPDATE public.profiles
    SET avatar_url = BUCKET_URL || '11.png', avatar_bg_color = '#F97316'
    WHERE id = '33333333-3333-3333-3333-333333333354';

    -- Sam Delos Reyes (33333333-3333-3333-3333-333333333355) - Loft 2E
    UPDATE public.profiles
    SET avatar_url = BUCKET_URL || '14.png', avatar_bg_color = '#06B6D4'
    WHERE id = '33333333-3333-3333-3333-333333333355';

    -- =============================================
    -- LANDLORD 11111111-1111-1111-1111-111111111113 (Isabella Mendoza)
    -- Properties: Metro Studio Hub, Lakeside Villa Estates
    -- =============================================

    -- Miguel Ramos (33333333-3333-3333-3333-333333333336) - Studio 101
    UPDATE public.profiles
    SET avatar_url = BUCKET_URL || '16.png', avatar_bg_color = '#F59E0B'
    WHERE id = '33333333-3333-3333-3333-333333333336';

    -- Elena Gilbert (33333333-3333-3333-3333-333333333350) - Studio 202
    UPDATE public.profiles
    SET avatar_url = BUCKET_URL || '18.png', avatar_bg_color = '#10B981'
    WHERE id = '33333333-3333-3333-3333-333333333350';

    -- =============================================
    -- LANDLORD 22222222-2222-2222-2222-222222222222 (Gabriel Santos)
    -- Properties: Sunrise Townhomes, The Garden Residences
    -- =============================================

    -- Sophia Tan (33333333-3333-3333-3333-333333333335) - Townhome 1
    UPDATE public.profiles
    SET avatar_url = BUCKET_URL || '12.png', avatar_bg_color = '#EF4444'
    WHERE id = '33333333-3333-3333-3333-333333333335';

    -- =============================================
    -- SEED LANDLORDS AVATARS (for consistency)
    -- =============================================
    UPDATE public.profiles
    SET avatar_url = BUCKET_URL || '5.png', avatar_bg_color = '#8B5CF6'
    WHERE id = '11111111-1111-1111-1111-111111111111';  -- Marina Reyes

    UPDATE public.profiles
    SET avatar_url = BUCKET_URL || '9.png', avatar_bg_color = '#14B8A6'
    WHERE id = '22222222-2222-2222-2222-222222222222';  -- Gabriel Santos

    UPDATE public.profiles
    SET avatar_url = BUCKET_URL || '13.png', avatar_bg_color = '#EF4444'
    WHERE id = '11111111-1111-1111-1111-111111111113';  -- Isabella Mendoza

    UPDATE public.profiles
    SET avatar_url = BUCKET_URL || '17.png', avatar_bg_color = '#3B82F6'
    WHERE id = '11111111-1111-1111-1111-111111111114';  -- Carlos Villanueva
END $$;

COMMIT;