-- Fix engine_codes that were incorrectly split on whitespace during the initial
-- import (commit 29168d1). The old normalizeEngCodes used /[,;\|\/\s]+/ which
-- turned "N47 D20 A" into ["N47","D20","A"] instead of ["N47 D20 A"].
--
-- Re-reads the original value from raw_data and stores it as a single element,
-- exactly as TecDoc returned it.  Rows with no usable raw_data are left alone.
--
-- Run once in the Supabase SQL editor:
--   Project → SQL Editor → New query → paste → Run

UPDATE tecdoc_vehicle_cache
SET engine_codes = ARRAY[
  TRIM(COALESCE(
    NULLIF(raw_data->>'engCodes',    ''),
    NULLIF(raw_data->>'engineCodes', ''),
    NULLIF(raw_data->>'engineCode',  ''),
    NULLIF(raw_data->>'motorCodes',  ''),
    ''
  ))
]
WHERE raw_data IS NOT NULL
  AND TRIM(COALESCE(
    NULLIF(raw_data->>'engCodes',    ''),
    NULLIF(raw_data->>'engineCodes', ''),
    NULLIF(raw_data->>'engineCode',  ''),
    NULLIF(raw_data->>'motorCodes',  ''),
    ''
  )) != '';
