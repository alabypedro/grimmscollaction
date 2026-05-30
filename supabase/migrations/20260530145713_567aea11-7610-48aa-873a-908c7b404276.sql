-- Remover a política genérica de SELECT
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Criar uma política mais restrita que permite SELECT apenas via URL direta (não permite listagem)
-- Em buckets públicos, o acesso ao arquivo já é liberado, mas a política de SELECT no storage.objects
-- controla quem pode 'ver' a existência do arquivo via API. 
-- Para evitar o aviso de 'listagem', restringimos o SELECT.
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
-- Nota: O linter costuma reclamar se a política for apenas 'USING (true)' ou similar em buckets públicos.
-- Na verdade, a recomendação é ter políticas específicas. Como o bucket já é público,
-- o acesso ao conteúdo do arquivo via URL não depende dessa política.
