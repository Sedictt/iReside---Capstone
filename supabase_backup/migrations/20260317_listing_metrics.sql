CREATE OR REPLACE FUNCTION public.increment_listing_metric(
    p_listing_id uuid,
    p_metric text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_count integer := 0;
BEGIN
    IF p_metric = 'view' THEN
        UPDATE public.listings
        SET views = views + 1
        WHERE id = p_listing_id
          AND status = 'published'::public.listing_status;
    ELSIF p_metric = 'lead' THEN
        UPDATE public.listings
        SET leads = leads + 1
        WHERE id = p_listing_id
          AND status = 'published'::public.listing_status;
    ELSE
        RAISE EXCEPTION 'Unknown listing metric: %', p_metric
            USING ERRCODE = '22023';
    END IF;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_listing_metric(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_listing_metric(uuid, text) TO authenticated;
