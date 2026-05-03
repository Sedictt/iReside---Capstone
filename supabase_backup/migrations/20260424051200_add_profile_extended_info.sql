-- Add bio, website, and address columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS address text;

-- Enable RLS for the new columns (already enabled for profiles, but just in case)
-- Existing policies for profiles should already cover these new columns.
