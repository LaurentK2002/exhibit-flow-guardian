-- Fix the security issue by adding proper search path to the function
DROP FUNCTION IF EXISTS generate_case_lab_number();

CREATE OR REPLACE FUNCTION generate_case_lab_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM NOW());
    next_number INTEGER := 1;
    existing_lab_number TEXT;
    new_lab_number TEXT;
BEGIN
    -- Get the highest lab number for the current year
    SELECT lab_number INTO existing_lab_number
    FROM public.cases
    WHERE lab_number LIKE 'FB/CYBER/' || current_year || '/CASE/%'
    ORDER BY lab_number DESC
    LIMIT 1;
    
    -- Extract the number and increment
    IF existing_lab_number IS NOT NULL THEN
        next_number := (regexp_match(existing_lab_number, '/CASE/(\d+)$'))[1]::INTEGER + 1;
    END IF;
    
    -- Generate new lab number
    new_lab_number := 'FB/CYBER/' || current_year || '/CASE/' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN new_lab_number;
END;
$$;