-- Fix category ID sequence if it's out of sync
-- This happens when data is inserted manually with explicit IDs
-- Run this script in your Supabase SQL editor or PostgreSQL client

-- First, check the current sequence value and max ID
SELECT 
  (SELECT last_value FROM category_id_seq) as current_sequence_value,
  (SELECT MAX(id) FROM category) as max_id_in_table,
  (SELECT MAX(id) FROM category) + 1 as next_id_should_be;

-- Reset the sequence to the correct value (MAIN FIX - run this)
SELECT setval('category_id_seq', COALESCE((SELECT MAX(id) FROM category), 0) + 1, false);

-- Verify the fix
SELECT 
  (SELECT last_value FROM category_id_seq) as new_sequence_value,
  (SELECT MAX(id) FROM category) as max_id_in_table;

