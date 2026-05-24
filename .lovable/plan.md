# Plano de Implementação: Painel Administrativo de Produtos (Admin)

Para implementar o CRUD de produtos, seguirei os passos abaixo:

1. **Configuração de Estado**: Criar um arquivo `src/lib/admin-store.ts` para gerenciar a lista de produtos globalmente, permitindo edições (Create, Update, Delete) que persistam durante a sessão.
2. **Criação da Rota Admin**:
    - Criar `src/routes/admin.tsx`: Dashboard principal com listagem dos produtos em uma tabela moderna.
    - Criar `src/routes/admin.produto.$id.tsx` (ou similar para edição/criação): Formulário para editar ou criar produtos.
3. **Componentes Auxiliares**:
    - `DataTable.tsx`: Componente de tabela otimizado para a listagem.
    - `ProductForm.tsx`: Formulário unificado com Tailwind para edição e criação.
4. **UI/UX**:
    - Estilo visual alinhado com a identidade *Dark Mode* da marca (fundo `#0A0A0A`, bordas roxas, campos elegantes).
    - Layout responsivo.
5. **Integração**: Atualizar a `router.tsx` (se necessário) para incluir as novas rotas.

### Detalhes Técnicos
- Utilizarei `zustand` para o gerenciamento de estado dos produtos.
- Os formulários serão construídos com componentes controlados usando `react-hook-form` (ou estado local simples para manter o foco na rapidez e eficácia).
- A tabela terá ações rápidas: "Editar" e "Excluir".
