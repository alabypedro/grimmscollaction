import { createFileRoute } from '@tanstack/react-router';
import React, { useState } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { Product, Category, CATEGORIES, MATERIALS, Material } from '@/lib/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  ArrowLeft,
  X,
  Settings2,
  Package,
  Layers,
  Palette,
  Layout
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin')({
  component: AdminPage,
});

function AdminPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduct(id);
      toast.success('Produto excluído com sucesso!');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
              Painel Administrativo
            </h1>
            <p className="text-zinc-400 mt-1">Gerencie seu catálogo de produtos premium</p>
          </div>
          <Button 
            onClick={handleAddNew}
            className="bg-[#8B00FF] hover:bg-[#7000CC] text-white gap-2 shadow-[0_0_15px_rgba(139,0,255,0.3)] transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        </header>

        {/* Search and Filters */}
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Buscar por nome ou categoria..."
              className="bg-black/40 border-white/10 pl-10 h-12 text-white placeholder:text-zinc-600 focus-visible:ring-[#8B00FF]/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-zinc-400 flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>{products.length} Produtos</span>
            </div>
          </div>
        </div>

        {/* Table/List */}
        <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white/5 text-zinc-400 text-xs uppercase tracking-wider font-semibold border-b border-white/5">
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Material</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-black flex-shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate max-w-[200px]">{product.name}</p>
                        <p className="text-xs text-zinc-500">ID: {product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">{product.material}</td>
                  <td className="px-6 py-4 font-semibold text-white">
                    {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <button 
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 opacity-20" />
                      <p>Nenhum produto encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Drawer/Modal Overlay */}
      {isFormOpen && (
        <ProductFormModal 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          product={editingProduct} 
          onSave={(data) => {
            if (editingProduct) {
              updateProduct(data);
              toast.success('Produto atualizado!');
            } else {
              addProduct({
                ...data,
                id: data.id || Math.random().toString(36).substr(2, 9),
                rating: 0,
                reviews: 0,
                popularity: 0,
              });
              toast.success('Produto adicionado!');
            }
            setIsFormOpen(false);
          }}
        />
      )}
    </div>
  );
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (data: Product) => void;
}

function ProductFormModal({ onClose, product, onSave }: ProductFormModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      name: '',
      price: 0,
      category: 'Miniaturas e Figuras' as Category,
      material: 'PLA' as Material,
      description: '',
      image: '',
      gallery: [],
      specs: [],
      colors: [],
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category || !formData.image) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    onSave(formData as Product);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {product ? <Edit className="w-5 h-5 text-[#8B00FF]" /> : <Plus className="w-5 h-5 text-[#8B00FF]" />}
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input 
                id="name"
                className="bg-black/40 border-white/10"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Capacete Dragon"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input 
                id="price"
                type="number"
                step="0.01"
                className="bg-black/40 border-white/10"
                value={formData.price}
                onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <select 
                className="w-full h-10 px-3 rounded-md bg-black/40 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B00FF]/50"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as Category})}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Material *</Label>
              <select 
                className="w-full h-10 px-3 rounded-md bg-black/40 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B00FF]/50"
                value={formData.material}
                onChange={e => setFormData({...formData, material: e.target.value as Material})}
              >
                {MATERIALS.map(mat => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">URL da Imagem Principal *</Label>
            <Input 
              id="image"
              className="bg-black/40 border-white/10"
              value={formData.image}
              onChange={e => setFormData({...formData, image: e.target.value})}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea 
              id="description"
              className="bg-black/40 border-white/10 min-h-[100px]"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Detalhes sobre o produto..."
            />
          </div>

          <div className="pt-4 border-t border-white/5 flex gap-3">
             <Button type="button" variant="ghost" className="flex-1 border border-white/10" onClick={onClose}>
               Cancelar
             </Button>
             <Button type="submit" className="flex-1 bg-[#8B00FF] hover:bg-[#7000CC]">
               {product ? 'Salvar Alterações' : 'Criar Produto'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
