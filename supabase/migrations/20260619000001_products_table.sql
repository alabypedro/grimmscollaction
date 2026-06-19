-- Products table
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  material TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  gallery TEXT[] DEFAULT '{}',
  specs JSONB DEFAULT '[]',
  colors JSONB DEFAULT '[]',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  hero BOOLEAN NOT NULL DEFAULT FALSE,
  popularity INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products viewable by everyone"
  ON public.products FOR SELECT USING (active = TRUE);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
