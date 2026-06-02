import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category, MATERIALS, Material } from '@/lib/products';
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
  Layout,
  Users,
  ShieldCheck,
  UserPlus,
  Mail,
  History,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin')({
  // Component handles its own session check to avoid SSR redirect issues
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [adminUsers, setAdminUsers] = React.useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = React.useState('');
  const [isManagingAdmins, setIsManagingAdmins] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'products' | 'admins' | 'emails'>('products');
  const [emailLogs, setEmailLogs] = React.useState<any[]>([]);
  const [emailStats, setEmailStats] = React.useState({ pending: 0 });
  const [loadingLogs, setLoadingLogs] = React.useState(false);

  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: '/auth/login', search: { redirect: window.location.href } });
      } else {
        setSession(session);
        // Check if user is admin
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        
        if (error || !profile?.is_admin) {
          toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
          navigate({ to: '/' });
          return;
        }
        setIsAdmin(true);
        fetchAdminUsers();
        fetchEmailData();
      }
      setLoading(false);
    };

    checkSession();
  }, [navigate]);

  const fetchEmailData = async () => {
    setLoadingLogs(true);
    try {
      // Fetch logs
      const { data: logs, error: logsError } = await supabase
        .from('email_send_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!logsError) setEmailLogs(logs || []);

      // Fetch pending counts from pgmq (using standard RPCs if available or direct queries)
      // Since we can't easily query pgmq tables via postgrest if not exposed,
      // we'll rely on what we can see or assume 0 for now if no rows.
      const { data: authCount } = await supabase.rpc('read_email_batch', { queue_name: 'auth_emails', batch_size: 1, vt: 30 });
      const { data: transCount } = await supabase.rpc('read_email_batch', { queue_name: 'transactional_emails', batch_size: 1, vt: 30 });
      
      // Note: read_email_batch makes them invisible, so this is just a quick check
      // Real monitoring usually needs custom RPCs for pgmq metrics.
    } catch (error) {
      console.error('Error fetching email data:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      // We can trigger a test by inserting into a queue if we have the RPCs
      // Or just send a password reset to current user as a test
      const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
        redirectTo: `${window.location.origin}/auth/recovery`,
      });
      
      if (error) throw error;
      toast.success('Email de teste solicitado (Redefinição de senha). Verifique a fila em instantes.');
      setTimeout(fetchEmailData, 2000);
    } catch (error: any) {
      toast.error('Erro ao enviar teste: ' + error.message);
    }
  };

  const fetchAdminUsers = async () => {
    const { data, error } = await supabase.rpc('get_admin_users');
    if (!error) {
      setAdminUsers(data);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;

    try {
      const { error } = await supabase.rpc('set_admin_by_email', {
        user_email: newAdminEmail,
        admin_status: true
      });

      if (error) throw error;

      toast.success(`${newAdminEmail} agora é um administrador!`);
      setNewAdminEmail('');
      fetchAdminUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar administrador');
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (email === session?.user?.email) {
      toast.error('Você não pode remover a si mesmo como administrador.');
      return;
    }

    if (confirm(`Tem certeza que deseja remover as permissões de admin de ${email}?`)) {
      try {
        const { error } = await supabase.rpc('set_admin_by_email', {
          user_email: email,
          admin_status: false
        });

        if (error) throw error;

        toast.success(`Permissões de ${email} removidas.`);
        fetchAdminUsers();
      } catch (error: any) {
        toast.error(error.message || 'Erro ao remover administrador');
      }
    }
  };

  const { products, addProduct, updateProduct, deleteProduct, categories, addCategory, deleteCategory } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

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
              {activeTab === 'admins' ? 'Gerenciar Administradores' : 
               activeTab === 'emails' ? 'Monitoramento de Emails' : 
               'Painel Administrativo'}
            </h1>
            <p className="text-zinc-400 mt-1">
              {activeTab === 'admins' ? 'Controle quem tem acesso ao painel de controle' : 
               activeTab === 'emails' ? 'Acompanhe a fila e o status dos disparos' :
               'Gerencie seu catálogo de produtos premium'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant={activeTab === 'products' ? "default" : "outline"}
              onClick={() => setActiveTab('products')}
              className={activeTab === 'products' ? "bg-[#8B00FF]" : "bg-black/40 border-white/10 text-white hover:bg-white/5 gap-2"}
            >
              <Package className="w-4 h-4" /> Produtos
            </Button>
            <Button 
              variant={activeTab === 'admins' ? "default" : "outline"}
              onClick={() => setActiveTab('admins')}
              className={activeTab === 'admins' ? "bg-[#8B00FF]" : "bg-black/40 border-white/10 text-white hover:bg-white/5 gap-2"}
            >
              <ShieldCheck className="w-4 h-4" /> Admins
            </Button>
            <Button 
              variant={activeTab === 'emails' ? "default" : "outline"}
              onClick={() => setActiveTab('emails')}
              className={activeTab === 'emails' ? "bg-[#8B00FF]" : "bg-black/40 border-white/10 text-white hover:bg-white/5 gap-2"}
            >
              <Mail className="w-4 h-4" /> Emails
            </Button>
            
            {activeTab === 'products' && (
              <Button 
                onClick={handleAddNew}
                className="bg-[#8B00FF] hover:bg-[#7000CC] text-white gap-2 shadow-[0_0_15px_rgba(139,0,255,0.3)] transition-all ml-auto md:ml-0"
              >
                <Plus className="w-4 h-4" /> Novo Produto
              </Button>
            )}
            
            {activeTab === 'emails' && (
              <Button 
                onClick={handleTestEmail}
                className="bg-white/10 hover:bg-white/20 text-white gap-2 border border-white/10"
              >
                <RefreshCw className="w-4 h-4" /> Enviar Teste
              </Button>
            )}
          </div>
        </header>

        {activeTab === 'admins' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Add Admin Form */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" /> Adicionar Novo Administrador
              </h3>
              <form onSubmit={handleAddAdmin} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <Label htmlFor="admin-email" className="text-zinc-400">Email do Usuário</Label>
                  <Input 
                    id="admin-email"
                    type="email"
                    placeholder="exemplo@email.com"
                    className="bg-black/40 border-white/10 h-12 text-white placeholder:text-zinc-600 focus-visible:ring-[#8B00FF]/50"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit"
                  className="bg-[#8B00FF] hover:bg-[#7000CC] text-white h-12 px-8 shadow-[0_0_15px_rgba(139,0,255,0.2)]"
                >
                  Tornar Admin
                </Button>
              </form>
              <p className="text-xs text-zinc-500 mt-3">
                O usuário deve ter uma conta criada no sistema antes de ser promovido a administrador.
              </p>
            </div>

            {/* Admins List */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-zinc-400 text-xs uppercase tracking-wider font-semibold border-b border-white/5">
                    <th className="px-6 py-4">Administrador</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {adminUsers.map((admin) => (
                    <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                            <Users className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{admin.full_name || admin.username || 'Sem nome'}</p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">Ativo</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{admin.email}</td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => handleRemoveAdmin(admin.email)}
                          disabled={admin.email === session?.user?.email}
                          title={admin.email === session?.user?.email ? "Você não pode remover a si mesmo" : "Remover acesso admin"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'emails' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Domain Status Card */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" /> Status do Domínio
                </h3>
                <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Verificação Pendente
                </span>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <p className="text-sm text-zinc-300">
                  O domínio <span className="text-purple-400 font-mono">notify.grimmscollection.com.br</span> está aguardando a propagação DNS. 
                  Certifique-se de que os registros CNAME e TXT fornecidos no painel Lovable Cloud foram adicionados corretamente ao seu provedor DNS.
                </p>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-400" /> Logs de Envio (Últimos 50)
                </h3>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={fetchEmailData}
                  className="text-zinc-400 hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingLogs ? 'animate-spin' : ''}`} /> Atualizar
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-zinc-400 text-xs uppercase tracking-wider font-semibold border-b border-white/5">
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Destinatário</th>
                      <th className="px-6 py-4">Modelo/Assunto</th>
                      <th className="px-6 py-4">Data/Hora</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {emailLogs.length > 0 ? (
                      emailLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            {log.status === 'sent' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                <CheckCircle2 className="w-3 h-3" /> Enviado
                              </span>
                            ) : log.status === 'failed' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                <AlertCircle className="w-3 h-3" /> Falhou
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                <Clock className="w-3 h-3" /> {log.status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-300">{log.recipient_email}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white">{log.template_name || 'Personalizado'}</div>
                            {log.error_message && (
                              <div className="text-[10px] text-red-400 truncate max-w-[200px]" title={log.error_message}>
                                {log.error_message}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-zinc-500">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-white">
                              <Search className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                          <div className="flex flex-col items-center gap-2">
                            <Mail className="w-8 h-8 opacity-20" />
                            <p>Nenhum log de envio encontrado.</p>
                            <p className="text-xs">Inicie disparos ou envie um teste para ver dados aqui.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                    <div className="flex items-center justify-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
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
      </>
    )}
  </div>

      {/* Product Form Drawer/Modal Overlay */}
      {isFormOpen && (
        <ProductFormModal 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          product={editingProduct}
          categories={categories}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
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
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  onSave: (data: Product) => void;
}

function ProductFormModal({ onClose, product, onSave, categories, onAddCategory, onDeleteCategory }: ProductFormModalProps) {
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
      featured: false,
    }
  );

  const [newSpec, setNewSpec] = useState({ label: '', value: '' });
  const [newColor, setNewColor] = useState({ name: '', hex: '#8B00FF' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category || !formData.image) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    onSave(formData as Product);
  };

  const addSpec = (label?: string, value?: string) => {
    const l = label || newSpec.label;
    const v = value || newSpec.value;
    
    // Allow adding shortcut specs even with empty values
    if (l) {
      setFormData(prev => ({
        ...prev,
        specs: [...(prev.specs || []), { label: l, value: v || '-' }]
      }));
      if (!label) setNewSpec({ label: '', value: '' });
    }
  };

  const removeSpec = (index: number) => {
    setFormData({
      ...formData,
      specs: (formData.specs || []).filter((_, i) => i !== index)
    });
  };

  const addColor = () => {
    if (newColor.name && newColor.hex) {
      setFormData({
        ...formData,
        colors: [...(formData.colors || []), { ...newColor }]
      });
      setNewColor({ name: '', hex: '#8B00FF' });
    }
  };

  const removeColor = (index: number) => {
    setFormData({
      ...formData,
      colors: (formData.colors || []).filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(139,0,255,0.15)] overflow-hidden max-h-[95vh] flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              {product ? <Edit className="w-5 h-5 text-[#8B00FF]" /> : <Plus className="w-5 h-5 text-[#8B00FF]" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {product ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <p className="text-xs text-zinc-500">Configure os detalhes do seu item premium</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
            <X className="w-5 h-5 text-zinc-500 group-hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
          {/* Sessão: Informações Básicas */}
          <section className="space-y-6">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4" /> Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-400">Nome do Produto *</Label>
                <Input 
                  id="name"
                  className="bg-black/60 border-white/10 focus:border-purple-500/50 transition-colors"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Capacete Dragon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-zinc-400">Preço (R$) *</Label>
                <Input 
                  id="price"
                  type="number"
                  step="0.01"
                  className="bg-black/60 border-white/10 focus:border-purple-500/50 transition-colors"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Categoria *</Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 h-10 px-3 rounded-md bg-black/60 border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-colors"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as Category})}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat} className="bg-[#0F0F0F]">{cat}</option>
                        ))}
                      </select>
                      <Input 
                        placeholder="Criar nova..."
                        className="w-32 bg-black/60 border-white/10 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              onAddCategory(val);
                              setFormData({...formData, category: val as Category});
                              e.currentTarget.value = '';
                              toast.success(`Categoria "${val}" adicionada!`);
                            }
                          }
                        }}
                      />
                    </div>
                    
                    {/* Lista de categorias para exclusão */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {categories.map(cat => (
                        <div key={cat} className="group flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-zinc-400">
                          {cat}
                          <button 
                            type="button" 
                            onClick={() => {
                              if (confirm(`Excluir categoria "${cat}"?`)) {
                                onDeleteCategory(cat);
                                if (formData.category === cat) {
                                  setFormData({...formData, category: categories.find(c => c !== cat) as Category || ''});
                                }
                                toast.success('Categoria excluída');
                              }
                            }}
                            className="text-zinc-600 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Material *</Label>
                <select 
                  className="w-full h-10 px-3 rounded-md bg-black/60 border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-colors"
                  value={formData.material}
                  onChange={e => setFormData({...formData, material: e.target.value as Material})}
                >
                  {MATERIALS.map(mat => (
                    <option key={mat} value={mat} className="bg-[#0F0F0F]">{mat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="featured" 
                checked={formData.featured}
                onChange={e => setFormData({...formData, featured: e.target.checked})}
                className="w-4 h-4 rounded border-white/10 bg-black text-purple-600 focus:ring-purple-500/50"
              />
              <Label htmlFor="featured" className="text-zinc-400 cursor-pointer select-none">Produto em Destaque (Home)</Label>
            </div>
          </section>

          {/* Sessão: Mídia e Descrição */}
          <section className="space-y-6 pt-6 border-t border-white/5">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Layout className="w-4 h-4" /> Mídia e Conteúdo
            </h3>
                <div className="space-y-2">
                  <Label htmlFor="image" className="text-zinc-400">URL da Imagem ou Upload Local *</Label>
                  <div className="flex gap-4">
                    <Input 
                      id="image"
                      className="bg-black/60 border-white/10 focus:border-purple-500/50 flex-1"
                      value={formData.image}
                      onChange={e => setFormData({...formData, image: e.target.value})}
                      placeholder="https://..."
                    />
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({...formData, image: reader.result as string});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <Button type="button" variant="outline" className="border-white/10 text-xs">
                        Upload
                      </Button>
                    </div>
                {formData.image && (
                  <div className="w-10 h-10 rounded-md border border-white/10 overflow-hidden bg-black flex-shrink-0">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-400">Descrição Detalhada</Label>
              <Textarea 
                id="description"
                className="bg-black/60 border-white/10 min-h-[120px] focus:border-purple-500/50"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Conte a história deste produto, detalhes técnicos, etc..."
              />
            </div>
          </section>

          {/* Sessão: Especificações Técnicas */}
          <section className="space-y-6 pt-6 border-t border-white/5">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" /> Especificações Técnicas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Rótulo (ex: Altura)</Label>
                <Input 
                  placeholder="Label" 
                  value={newSpec.label} 
                  onChange={e => setNewSpec({...newSpec, label: e.target.value})}
                  className="bg-black/60 border-white/10 h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Valor (ex: 75mm)</Label>
                <Input 
                  placeholder="Valor" 
                  value={newSpec.value} 
                  onChange={e => setNewSpec({...newSpec, value: e.target.value})}
                  className="bg-black/60 border-white/10 h-9 text-sm"
                />
              </div>
              <Button type="button" onClick={() => addSpec()} className="bg-white/5 hover:bg-white/10 text-white h-9 border border-white/10">
                Adicionar Spec
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500 italic">Atalhos rápidos:</Label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" className="text-[10px] h-7 border-purple-500/20 hover:bg-purple-500/10" onClick={() => addSpec('Tamanho', ' ')}>+ Tamanho</Button>
                  <Button type="button" size="sm" variant="outline" className="text-[10px] h-7 border-purple-500/20 hover:bg-purple-500/10" onClick={() => addSpec('Material', ' ')}>+ Material</Button>
                  <Button type="button" size="sm" variant="outline" className="text-[10px] h-7 border-purple-500/20 hover:bg-purple-500/10" onClick={() => addSpec('Peso', ' ')}>+ Peso</Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {(formData.specs || []).map((spec, idx) => {
                const isShortcutSpec = ['Tamanho', 'Material', 'Peso'].includes(spec.label);
                return (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-black/40 border border-white/5 rounded-lg group">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      {isShortcutSpec ? (
                        <div className="h-8 flex items-center text-xs text-zinc-500 font-medium select-none px-0">
                          {spec.label}
                        </div>
                      ) : (
                        <Input 
                          className="h-8 bg-transparent border-none text-xs text-zinc-500 p-0 focus-visible:ring-0" 
                          value={spec.label} 
                          onChange={(e) => {
                            const newSpecs = [...(formData.specs || [])];
                            newSpecs[idx].label = e.target.value;
                            setFormData({...formData, specs: newSpecs});
                          }}
                        />
                      )}
                      <Input 
                        className="h-8 bg-transparent border-none text-xs text-white p-0 focus-visible:ring-0 font-medium placeholder:text-zinc-600/50" 
                        value={spec.value === ' ' ? '' : spec.value} 
                        placeholder={isShortcutSpec ? spec.label : "Definir valor..."}
                        onChange={(e) => {
                          const newSpecs = [...(formData.specs || [])];
                          newSpecs[idx].value = e.target.value;
                          setFormData({...formData, specs: newSpecs});
                        }}
                      />
                    </div>
                    <button type="button" onClick={() => removeSpec(idx)} className="p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Sessão: Cores */}
          <section className="space-y-6 pt-6 border-t border-white/5">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4" /> Opções de Cores
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Nome da Cor</Label>
                <Input 
                  placeholder="Nome" 
                  value={newColor.name} 
                  onChange={e => setNewColor({...newColor, name: e.target.value})}
                  className="bg-black/60 border-white/10 h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Cor Hex</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={newColor.hex} 
                    onChange={e => setNewColor({...newColor, hex: e.target.value})}
                    className="w-10 h-9 p-0 bg-transparent border-none"
                  />
                  <Input 
                    placeholder="#000000" 
                    value={newColor.hex} 
                    onChange={e => setNewColor({...newColor, hex: e.target.value})}
                    className="bg-black/60 border-white/10 h-9 text-sm flex-1"
                  />
                </div>
              </div>
              <Button type="button" onClick={addColor} className="bg-white/5 hover:bg-white/10 text-white h-9 border border-white/10">
                Adicionar Cor
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {(formData.colors || []).map((color, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/5 rounded-full group">
                  <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: color.hex }} />
                  <span className="text-xs text-zinc-300">{color.name}</span>
                  <button type="button" onClick={() => removeColor(idx)} className="text-zinc-600 hover:text-red-500 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Ações do Rodapé */}
          <div className="pt-8 border-t border-white/5 flex gap-4">
             <Button type="button" variant="ghost" className="flex-1 border border-white/10 text-zinc-400 hover:text-white" onClick={onClose}>
               Descartar
             </Button>
             <Button type="submit" className="flex-1 bg-[#8B00FF] hover:bg-[#7000CC] text-white shadow-[0_0_20px_rgba(139,0,255,0.3)]">
               {product ? 'Salvar Alterações' : 'Publicar Produto'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
