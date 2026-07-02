CREATE OR REPLACE FUNCTION public.submit_incident(
  _name text, _class_teacher text, _class_name text, _problem text, _witness text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code text;
BEGIN
  IF length(coalesce(_name,'')) = 0 OR length(_name) > 100 THEN RAISE EXCEPTION 'invalid name'; END IF;
  IF length(coalesce(_class_teacher,'')) = 0 OR length(_class_teacher) > 100 THEN RAISE EXCEPTION 'invalid class teacher'; END IF;
  IF length(coalesce(_class_name,'')) = 0 OR length(_class_name) > 50 THEN RAISE EXCEPTION 'invalid class'; END IF;
  IF length(coalesce(_problem,'')) < 5 OR length(_problem) > 4000 THEN RAISE EXCEPTION 'invalid problem'; END IF;
  IF _witness IS NOT NULL AND length(_witness) > 500 THEN RAISE EXCEPTION 'invalid witness'; END IF;

  INSERT INTO public.incidents (name, class_teacher, class_name, problem, witness)
  VALUES (trim(_name), trim(_class_teacher), trim(_class_name), trim(_problem), nullif(trim(coalesce(_witness,'')),''))
  RETURNING tracking_code INTO _code;

  RETURN _code;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_incident(text,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_incident(text,text,text,text,text) TO anon, authenticated;