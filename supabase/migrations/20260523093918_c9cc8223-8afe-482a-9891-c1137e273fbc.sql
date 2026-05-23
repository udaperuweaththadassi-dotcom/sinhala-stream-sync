
ALTER TABLE public.licenses
  ADD COLUMN IF NOT EXISTS key_code text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_ad_key boolean NOT NULL DEFAULT false;

ALTER TABLE public.licenses ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.licenses ALTER COLUMN license_key DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS licenses_key_code_unique ON public.licenses(key_code) WHERE key_code IS NOT NULL;

DROP POLICY IF EXISTS "Anyone can insert ad keys" ON public.licenses;
CREATE POLICY "Anyone can insert ad keys"
  ON public.licenses
  FOR INSERT
  TO public
  WITH CHECK (is_ad_key = true);
