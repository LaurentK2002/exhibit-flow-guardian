-- Update the generate_case_lab_number function to use LAB instead of CASE
CREATE OR REPLACE FUNCTION public.generate_case_lab_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM NOW());
    next_number INTEGER := 1;
    existing_lab_number TEXT;
    new_lab_number TEXT;
BEGIN
    -- Get the highest lab number for the current year
    SELECT lab_number INTO existing_lab_number
    FROM public.cases
    WHERE lab_number LIKE 'FB/CYBER/' || current_year || '/LAB/%'
    ORDER BY lab_number DESC
    LIMIT 1;
    
    -- Extract the number and increment
    IF existing_lab_number IS NOT NULL THEN
        next_number := (regexp_match(existing_lab_number, '/LAB/(\d+)$'))[1]::INTEGER + 1;
    END IF;
    
    -- Generate new lab number
    new_lab_number := 'FB/CYBER/' || current_year || '/LAB/' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN new_lab_number;
END;
$function$;