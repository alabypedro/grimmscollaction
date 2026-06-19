-- Products storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Product images publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'products' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'products' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'products' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

-- Seed products (using /products/ static public path)
INSERT INTO public.products
  (id, name, price, category, material, description, image_url, gallery, specs, colors, featured, hero, popularity, stock, active)
VALUES
  (
    'guardiao-sombrio',
    'Guardião Sombrio — Miniatura Premium',
    189.90, 'Miniaturas e Figuras', 'Resina',
    'Miniatura colecionável esculpida em alta resolução, impressa em resina premium com acabamento detalhado pintado à mão. Ideal para colecionadores, RPG e dioramas.',
    '/products/product-1.jpg',
    ARRAY['/products/product-1.jpg', '/products/product-6.jpg', '/products/product-3.jpg'],
    '[{"label":"Altura","value":"75mm"},{"label":"Material","value":"Resina UV 8K"},{"label":"Acabamento","value":"Pintado à mão"},{"label":"Base inclusa","value":"Sim — 32mm"}]',
    '[{"name":"Violeta Sombrio","hex":"#8B00FF"},{"name":"Preto Obsidiana","hex":"#0A0A0A"},{"name":"Prata Espectro","hex":"#C0C0C0"}]',
    true, true, 98, 50, true
  ),
  (
    'helm-cyber-vanguard',
    'Helm Cyber Vanguard — Cosplay',
    749.00, 'Cosplay & Acessórios', 'PETG',
    'Capacete cosplay full-scale com sistema modular, LEDs RGB embutidos e visor escurecido. Estrutura leve em PETG reforçado, pronto para vestir.',
    '/products/product-2.jpg',
    ARRAY['/products/product-2.jpg', '/products/product-4.jpg', '/products/product-1.jpg'],
    '[{"label":"Tamanho","value":"Ajustável M/L"},{"label":"Material","value":"PETG + EVA interno"},{"label":"LED","value":"RGB 5V USB-C"},{"label":"Peso","value":"820g"}]',
    '[{"name":"Magenta Neon","hex":"#C026D3"},{"name":"Preto Mate","hex":"#0A0A0A"}]',
    true, true, 92, 20, true
  ),
  (
    'orb-hexagonal',
    'Orb Hexagonal — Luminária Decorativa',
    259.00, 'Decoração e Esculturas', 'PLA',
    'Escultura geométrica iluminada por LED âmbar/roxo. Padrão hexagonal preciso, projeta sombras hipnóticas no ambiente.',
    '/products/product-3.jpg',
    ARRAY['/products/product-3.jpg', '/products/product-5.jpg', '/products/product-6.jpg'],
    '[{"label":"Diâmetro","value":"18cm"},{"label":"Material","value":"PLA Premium Matte"},{"label":"Iluminação","value":"LED RGB Bluetooth"},{"label":"Alimentação","value":"USB-C 5V"}]',
    '[{"name":"Preto Profundo","hex":"#0A0A0A"},{"name":"Cinza Espacial","hex":"#3A3A3A"}]',
    true, true, 95, 35, true
  ),
  (
    'stand-levitar',
    'Stand Levitar — Suporte de Celular',
    129.90, 'Gadgets e Utilidades', 'ABS',
    'Suporte de celular com base iluminada e ângulo ajustável. Construção sólida em ABS com underglow neon roxo customizável.',
    '/products/product-4.jpg',
    ARRAY['/products/product-4.jpg', '/products/product-5.jpg'],
    '[{"label":"Compatibilidade","value":"Todos celulares"},{"label":"Material","value":"ABS Industrial"},{"label":"LED","value":"Underglow RGB"},{"label":"Cabo","value":"USB-C 1.5m"}]',
    '[{"name":"Preto Mate","hex":"#0A0A0A"},{"name":"Branco Polar","hex":"#F5F5F5"}]',
    true, false, 88, 80, true
  ),
  (
    'engrenagem-arcana',
    'Engrenagem Arcana — Peça Funcional',
    89.00, 'Peças Funcionais', 'TPU',
    'Peça funcional de engrenagem com tolerância industrial. Ideal para mecanismos, protótipos e projetos maker de precisão.',
    '/products/product-5.jpg',
    ARRAY['/products/product-5.jpg', '/products/product-3.jpg'],
    '[{"label":"Diâmetro","value":"60mm"},{"label":"Material","value":"TPU 95A"},{"label":"Tolerância","value":"±0.1mm"},{"label":"Cor base","value":"Preto / Roxo"}]',
    '[{"name":"Preto Industrial","hex":"#0A0A0A"},{"name":"Violeta","hex":"#8B00FF"}]',
    false, false, 76, 100, true
  ),
  (
    'dragao-ametista',
    'Dragão Ametista — Colecionável',
    459.00, 'Miniaturas e Figuras', 'Resina',
    'Estatueta colecionável de dragão articulado, escamas detalhadas e asas membranosas translúcidas. Edição limitada.',
    '/products/product-6.jpg',
    ARRAY['/products/product-6.jpg', '/products/product-1.jpg', '/products/product-3.jpg'],
    '[{"label":"Altura","value":"22cm"},{"label":"Material","value":"Resina Premium"},{"label":"Edição","value":"Limitada — 500 un."},{"label":"Certificado","value":"Numerado"}]',
    '[{"name":"Ametista","hex":"#8B00FF"},{"name":"Ônix","hex":"#0A0A0A"}]',
    true, true, 99, 15, true
  )
ON CONFLICT (id) DO NOTHING;

-- Admin RPC to update order status (for admin panel)
CREATE OR REPLACE FUNCTION public.update_order_status(order_id UUID, new_status TEXT, new_tracking TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  UPDATE public.orders
  SET status = new_status,
      tracking_code = COALESCE(new_tracking, tracking_code),
      updated_at = NOW()
  WHERE id = order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
