-- Fix teams table: replace captain_id (UUID FK) with captain (text)
-- Run this in Supabase SQL Editor

ALTER TABLE public.teams DROP COLUMN IF EXISTS captain_id;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS captain text;
