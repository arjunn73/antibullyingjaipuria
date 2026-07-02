
-- Add photo column
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS witness_photo_path text;

-- Storage policies for 'evidence' bucket
CREATE POLICY "anyone can upload evidence"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'evidence');

CREATE POLICY "admins can read evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'evidence' AND private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins can delete evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'evidence' AND private.has_role(auth.uid(), 'admin'::public.app_role));

-- Update private.submit_incident to accept photo path
DROP FUNCTION IF EXISTS public.submit_incident(text,text,text,text,text);
DROP FUNCTION IF EXISTS private.submit_incident(text,text,text,text,text);

CREATE OR REPLACE FUNCTION private.submit_incident(
  _name text, _class_teacher text, _class_name text, _problem text,
  _witness text DEFAULT NULL, _witness_photo_path text DEFAULT NULL
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
  IF _witness_photo_path IS NOT NULL AND length(_witness_photo_path) > 500 THEN RAISE EXCEPTION 'invalid photo path'; END IF;

  INSERT INTO public.incidents (name, class_teacher, class_name, problem, witness, witness_photo_path)
  VALUES (
    trim(_name), trim(_class_teacher), trim(_class_name), trim(_problem),
    nullif(trim(coalesce(_witness,'')),''),
    nullif(trim(coalesce(_witness_photo_path,'')),'')
  )
  RETURNING tracking_code INTO _code;

  RETURN _code;
END;
$$;

REVOKE ALL ON FUNCTION private.submit_incident(text,text,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION private.submit_incident(text,text,text,text,text,text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.submit_incident(
  _name text, _class_teacher text, _class_name text, _problem text,
  _witness text DEFAULT NULL, _witness_photo_path text DEFAULT NULL
) RETURNS text
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.submit_incident(_name, _class_teacher, _class_name, _problem, _witness, _witness_photo_path);
$$;

REVOKE ALL ON FUNCTION public.submit_incident(text,text,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_incident(text,text,text,text,text,text) TO anon, authenticated, service_role;
