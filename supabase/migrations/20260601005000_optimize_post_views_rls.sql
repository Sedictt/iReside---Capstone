-- Keep community post analytics wired while avoiding per-row auth function calls.

DROP POLICY IF EXISTS "Authors can view post stats" ON public.post_views;
DROP POLICY IF EXISTS "Post views insert allowed" ON public.post_views;

CREATE POLICY "Authors can view post stats"
ON public.post_views
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.community_posts
        WHERE community_posts.id = post_views.post_id
          AND community_posts.author_id = (select auth.uid())
    )
);

CREATE POLICY "Post views insert allowed"
ON public.post_views
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');
