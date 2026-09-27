-- Update default avatar_bg_color from legacy #171717 to brand violet #8B5CF6
ALTER TABLE public.profiles ALTER COLUMN avatar_bg_color SET DEFAULT '#8B5CF6';

-- Update existing profiles that are using the pitch-black default
UPDATE public.profiles
SET avatar_bg_color = '#8B5CF6'
WHERE avatar_bg_color = '#171717' OR avatar_bg_color = '#000000' OR avatar_bg_color IS NULL;
