import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { useAllProducts } from "@/lib/use-products";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Material, Category } from "@/lib/products";
import { MATERIALS } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { formatBRL } from "@/lib/cart";
import {
  Plus, Trash2, Edit, Search, X, Settings2, Package, Layers, Palette,
  Layout, Users, ShieldCheck, UserPlus, Mail, History, AlertCircle,
  CheckCircle2, Clock, RefreshCw, ShoppingCart, Truck, Upload, Loader2
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Administrativo — Grimm's Collection" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Tab = "products" | "orders" | "admins" | "emails";

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<Tab>("products");

  const [adminUsers, setAdminUsers] = React.useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = React.useState("");
  const [emailLogs, setEmailLogs] = React.useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = React.useState(false);

  const { data: products = [], isLoading: loadingProducts } = useAllProducts();
  const { heroProductIds, setHeroProductIds } = useAdminStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/auth/login" });
        return;
      }
      setSession(session);
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single();
      if (!profile?.is_admin) {
        toast.error("Acesso negado.");
        navigate({ to: "/" });
        return;
      }
      setIsAdmin(true);
      fetchAdminUsers();
      fetchEmailData();
      setLoading(false);
    };
    checkSession();
  }, []);

  const fetchEmailData = async () => {
    setLoadingLogs(true);
    const { data } = await supabase.from("email_send_log").select("*").order("created_at", { ascending: false }).limit(50);
    setEmailLogs(data || []);
    setLoadingLogs(false);
  };

  const fetchAdminUsers = async () => {
    const { data } = await supabase.rpc("get_admin_users");
    setAdminUsers(data || []);
  };

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto excluído!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    try {
      const { error } = await supabase.rpc("set_admin_by_email", { user_email: newAdminEmail, admin_status: true });
      if (error) throw error;
      toast.success(`${newAdminEmail} agora é administrador!`);
      setNewAdminEmail("");
      fetchAdminUsers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (email === session?.user?.email) return toast.error("Você não pode remover a si mesmo.");
    if (!confirm(`Remover admin: ${email}?`)) return;
    try {
      await supabase.rpc("set_admin_by_email", { user_email: email, admin_status: false });
      toast.success("Admin removido.");
      fetchAdminUsers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "products", label: "Produtos", icon: Package },
    { id: "orders", label: "Pedidos", icon: ShoppingCart },
    { id: "admins", label: "Admins", icon: ShieldCheck },
    { id: "emails", label: "Emails", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
              Painel Administrativo
            </h1>
            <p className="text-zinc-400 mt-1">Gerenciamento completo da Grimm's Collection</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className={`gap-2 ${activeTab === tab.id ? "bg-[#8B00FF]" : "bg-black/40 border-white/10 text-white hover:bg-white/5"}`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </Button>
            ))}
            {activeTab === "products" && (
              <Button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="bg-[#8B00FF] hover:bg-[#7000CC] gap-2 ml-auto md:ml-0">
                <Plus className="w-4 h-4" /> Novo Produto
              </Button>
            )}
          </div>
        </header>

        {activeTab === "products" && (
          <ProductsTab
            products={filteredProducts}
            allProducts={products}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            heroProductIds={heroProductIds}
            setHeroProductIds={setHeroProductIds}
            onEdit={(p: Product) => { setEditingProduct(p); setIsFormOpen(true); }}
            onDelete={(id: string) => { if (confirm("Excluir produto?")) deleteProductMutation.mutate(id); }}
            loadingProducts={loadingProducts}
          />
        )}

        {activeTab === "orders" && <OrdersTab />}

        {activeTab === "admins" && (
          <AdminsTab
            adminUsers={adminUsers}
            newAdminEmail={newAdminEmail}
            setNewAdminEmail={setNewAdminEmail}
            onAdd={handleAddAdmin}
            onRemove={handleRemoveAdmin}
            session={session}
          />
        )}

        {activeTab === "emails" && (
          <EmailsTab logs={emailLogs} loading={loadingLogs} onRefresh={fetchEmailData} />
        )}
      </div>

      {isFormOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setIsFormOpen(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setIsFormOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ─── Products Tab ─── */
function ProductsTab({ products, allProducts, searchTerm, setSearchTerm, heroProductIds, setHeroProductIds, onEdit, onDelete, loadingProducts }: any) {
  return (
    <>
      {/* Hero selector */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Layout className="w-5 h-5 text-purple-400" /> Destaques do Topo (Hero)
        </h3>
        <p className="text-sm text-zinc-400 mb-4">Selecione até 5 produtos para o carrossel da página inicial.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {allProducts.map((p: Product) => {
            const selected = heroProductIds?.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => {
                  const ids: string[] = heroProductIds ?? [];
                  if (selected) setHeroProductIds(ids.filter((id: string) => id !== p.id));
                  else if (ids.length < 5) setHeroProductIds([...ids, p.id]);
                  else toast.error("Limite de 5 produtos.");
                }}
                className={`p-2 rounded-xl border cursor-pointer transition-all ${selected ? "bg-purple-500/10 border-purple-500/40" : "bg-black/20 border-white/5 hover:border-white/20"}`}
              >
                <img src={p.image_url ?? "/products/product-1.jpg"} alt="" className="w-full aspect-square rounded-md object-cover mb-1.5" />
                <p className="text-[10px] font-medium text-white truncate">{p.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 mb-6 flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input placeholder="Buscar por nome ou categoria..." className="bg-black/40 border-white/10 pl-10 h-11 text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="text-sm text-zinc-400 px-3">{products.length} produtos</div>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-white/5 text-zinc-400 text-xs uppercase tracking-wider font-semibold border-b border-white/5">
              <th className="px-5 py-4">Produto</th>
              <th className="px-5 py-4">Categoria</th>
              <th className="px-5 py-4">Material</th>
              <th className="px-5 py-4">Estoque</th>
              <th className="px-5 py-4">Preço</th>
              <th className="px-5 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loadingProducts ? (
              <tr><td colSpan={6} className="py-12 text-center text-zinc-500"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>
            ) : products.map((p: Product) => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-black flex-shrink-0">
                      <img src={p.image_url ?? "/products/product-1.jpg"} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-white truncate max-w-[180px]">{p.name}</p>
                      <p className="text-[10px] text-zinc-500">ID: {p.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">{p.category}</span>
                </td>
                <td className="px-5 py-4 text-zinc-400 text-sm">{p.material}</td>
                <td className="px-5 py-4 text-sm">
                  <span className={p.stock > 0 ? "text-green-400" : "text-red-400"}>{p.stock}</span>
                </td>
                <td className="px-5 py-4 font-semibold text-white">{formatBRL(p.price)}</td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => onEdit(p)}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-red-500" onClick={() => onDelete(p.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loadingProducts && products.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-zinc-500">Nenhum produto encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ─── Orders Tab ─── */
function OrdersTab() {
  const queryClient = useQueryClient();
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data: rawOrders } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const { data: items } = await supabase.from("order_items").select("*").in("order_id", (rawOrders ?? []).map((o) => o.id));
    const data = (rawOrders ?? []).map((o) => ({ ...o, order_items: (items ?? []).filter((i) => i.order_id === o.id) }));
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: string, tracking?: string) => {
    setUpdating(orderId);
    try {
      await supabase.rpc("update_order_status", { order_id: orderId, new_status: status, new_tracking: tracking });
      toast.success("Status atualizado!");
      loadOrders();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const STATUS_OPTIONS = ["aguardando_pagamento", "pendente", "processando", "enviado", "entregue", "cancelado"];
  const STATUS_COLORS: Record<string, string> = {
    aguardando_pagamento: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    pendente: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    processando: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    enviado: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    entregue: "text-green-400 bg-green-400/10 border-green-400/20",
    cancelado: "text-red-400 bg-red-400/10 border-red-400/20",
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-zinc-400 text-sm">{orders.length} pedido{orders.length !== 1 && "s"}</p>
        <Button size="sm" variant="ghost" className="text-zinc-400" onClick={loadOrders}><RefreshCw className="w-4 h-4 mr-1" /> Atualizar</Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>Nenhum pedido encontrado.</p>
        </div>
      ) : orders.map((order) => (
        <div key={order.id} className="bg-[#111111] border border-white/5 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-zinc-400">#{order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-sm text-white mt-0.5">{order.shipping_name}</p>
              <p className="text-xs text-zinc-500">{new Date(order.created_at).toLocaleString("pt-BR")}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                className={`text-xs px-2.5 py-1 rounded-full border font-bold bg-transparent cursor-pointer ${STATUS_COLORS[order.status] ?? "text-zinc-400 border-zinc-400/20"}`}
                value={order.status}
                disabled={updating === order.id}
                onChange={(e) => updateStatus(order.id, e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-[#111] text-white">{s}</option>)}
              </select>
              <span className="font-black text-white">{formatBRL(order.total)}</span>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {(order.order_items as any[]).map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                {item.product_image && <img src={item.product_image} alt="" className="h-8 w-8 rounded object-cover" />}
                <span className="flex-1 text-zinc-300 truncate">{item.product_name}</span>
                <span className="text-zinc-500">x{item.quantity}</span>
                <span className="text-zinc-400">{formatBRL(item.total_price)}</span>
              </div>
            ))}
          </div>

          <div className="px-4 pb-4 border-t border-white/5 pt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-zinc-500">
              <p>{order.shipping_service}</p>
              <p>{order.shipping_city}/{order.shipping_state} — CEP {order.shipping_cep}</p>
            </div>
            {order.status === "enviado" && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Código de rastreio"
                  className="h-8 text-xs bg-black/40 border-white/10 w-40"
                  defaultValue={order.tracking_code || ""}
                  onBlur={(e) => { if (e.target.value !== order.tracking_code) updateStatus(order.id, order.status, e.target.value); }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Admins Tab ─── */
function AdminsTab({ adminUsers, newAdminEmail, setNewAdminEmail, onAdd, onRemove, session }: any) {
  return (
    <div className="space-y-8">
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-purple-400" /> Adicionar Administrador
        </h3>
        <form onSubmit={onAdd} className="flex flex-col md:flex-row gap-4">
          <Input type="email" placeholder="email@exemplo.com" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className="bg-black/40 border-white/10 h-11 text-white flex-1" required />
          <Button type="submit" className="bg-[#8B00FF] hover:bg-[#7000CC] h-11 px-8">Tornar Admin</Button>
        </form>
      </div>
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-white/5 text-zinc-400 text-xs uppercase tracking-wider border-b border-white/5">
            <th className="px-6 py-4">Administrador</th>
            <th className="px-6 py-4">Email</th>
            <th className="px-6 py-4 text-right">Ações</th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {adminUsers.map((admin: any) => (
              <tr key={admin.id} className="hover:bg-white/[0.02]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <Users className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="font-medium text-white">{admin.full_name || admin.username || "Sem nome"}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-400">{admin.email}</td>
                <td className="px-6 py-4 text-right">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-red-500" onClick={() => onRemove(admin.email)} disabled={admin.email === session?.user?.email}><Trash2 className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Emails Tab ─── */
function EmailsTab({ logs, loading, onRefresh }: any) {
  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2"><History className="w-5 h-5 text-purple-400" /> Logs de Envio</h3>
        <Button size="sm" variant="ghost" onClick={onRefresh} className="text-zinc-400"><RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Atualizar</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-white/5 text-zinc-400 text-xs uppercase tracking-wider border-b border-white/5">
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Destinatário</th>
            <th className="px-6 py-4">Template</th>
            <th className="px-6 py-4">Data</th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {logs.length === 0 ? (
              <tr><td colSpan={4} className="py-12 text-center text-zinc-500"><Mail className="w-8 h-8 mx-auto mb-2 opacity-20" />Nenhum log.</td></tr>
            ) : logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-white/[0.02]">
                <td className="px-6 py-4">
                  {log.status === "sent"
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-green-500/10 text-green-400 border border-green-500/20"><CheckCircle2 className="w-3 h-3" /> Enviado</span>
                    : log.status === "failed"
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-400 border border-red-500/20"><AlertCircle className="w-3 h-3" /> Falhou</span>
                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"><Clock className="w-3 h-3" /> {log.status}</span>}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-300">{log.recipient_email}</td>
                <td className="px-6 py-4 text-sm text-white">{log.template_name}</td>
                <td className="px-6 py-4 text-xs text-zinc-500">{new Date(log.created_at).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Product Form Modal ─── */
interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

function ProductFormModal({ product, onClose, onSaved }: ProductFormProps) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Partial<Product> & { id: string }>(
    product
      ? { ...product }
      : {
          id: "",
          name: "",
          price: 0,
          category: "Miniaturas e Figuras" as Category,
          material: "PLA" as Material,
          description: "",
          image_url: "",
          gallery: [],
          specs: [],
          colors: [],
          featured: false,
          hero: false,
          stock: 0,
          active: true,
          rating: 0,
          reviews: 0,
          popularity: 0,
        }
  );

  const [newSpec, setNewSpec] = useState({ label: "", value: "" });
  const [newColor, setNewColor] = useState({ name: "", hex: "#8B00FF" });

  async function uploadImage(file: File, field: "main" | "gallery") {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${form.id || Date.now()}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("products").upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(path);
      if (field === "main") {
        setForm((p) => ({ ...p, image_url: publicUrl }));
      } else {
        setForm((p) => ({ ...p, gallery: [...(p.gallery || []), publicUrl] }));
      }
      toast.success("Imagem carregada!");
    } catch (e: any) {
      toast.error("Erro ao fazer upload: " + e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) return toast.error("Preencha os campos obrigatórios.");
    if (!form.id && !product) {
      toast.error("ID do produto é obrigatório (slug único).");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: form.id,
        name: form.name!,
        price: form.price!,
        category: form.category!,
        material: form.material ?? "PLA",
        description: form.description,
        image_url: form.image_url,
        gallery: form.gallery || [],
        specs: form.specs || [],
        colors: form.colors || [],
        featured: form.featured ?? false,
        hero: form.hero ?? false,
        popularity: form.popularity ?? 0,
        stock: form.stock ?? 0,
        active: form.active ?? true,
      };

      if (product) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
        toast.success("Produto atualizado!");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Produto criado!");
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-xl overflow-hidden max-h-[95vh] flex flex-col">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40">
          <h2 className="text-xl font-bold text-white">{product ? "Editar Produto" : "Novo Produto"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Básico */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2"><Package className="w-4 h-4" /> Informações Básicas</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-400">ID / Slug *</Label>
                <Input className="bg-black/60 border-white/10" value={form.id} onChange={(e) => setForm((p) => ({ ...p, id: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} placeholder="meu-produto-unico" disabled={!!product} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400">Nome *</Label>
                <Input className="bg-black/60 border-white/10" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nome do produto" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-400">Preço (R$) *</Label>
                <Input type="number" step="0.01" className="bg-black/60 border-white/10" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: parseFloat(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400">Estoque</Label>
                <Input type="number" className="bg-black/60 border-white/10" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: parseInt(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400">Material</Label>
                <select className="w-full h-10 px-3 rounded-md bg-black/60 border border-white/10 text-sm text-white focus:outline-none" value={form.material} onChange={(e) => setForm((p) => ({ ...p, material: e.target.value as Material }))}>
                  {MATERIALS.map((m) => <option key={m} value={m} className="bg-[#0F0F0F]">{m}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400">Categoria *</Label>
              <Input className="bg-black/60 border-white/10" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Ex: Miniaturas e Figuras" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400">Descrição</Label>
              <Textarea className="bg-black/60 border-white/10 min-h-[100px]" value={form.description ?? ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.featured ?? false} onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))} className="w-4 h-4 rounded text-purple-600" />
                <span className="text-sm text-zinc-400">Produto em Destaque</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.hero ?? false} onChange={(e) => setForm((p) => ({ ...p, hero: e.target.checked }))} className="w-4 h-4 rounded text-purple-600" />
                <span className="text-sm text-zinc-400">Aparece no Hero</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} className="w-4 h-4 rounded text-purple-600" />
                <span className="text-sm text-zinc-400">Ativo</span>
              </label>
            </div>
          </section>

          {/* Imagens */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2"><Layout className="w-4 h-4" /> Imagens</h3>

            <div className="space-y-2">
              <Label className="text-zinc-400">Imagem Principal</Label>
              <div className="flex gap-3 items-center">
                <Input className="bg-black/60 border-white/10 flex-1" value={form.image_url ?? ""} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="URL ou faça upload abaixo" />
                <label className="relative cursor-pointer">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 w-full cursor-pointer" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "main"); }} />
                  <Button type="button" variant="outline" className="border-white/10 gap-1.5" disabled={uploading}>
                    {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload
                  </Button>
                </label>
                {form.image_url && <img src={form.image_url} alt="" className="h-10 w-10 rounded-md object-cover border border-white/10" />}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">Galeria</Label>
              <div className="flex flex-wrap gap-2">
                {(form.gallery || []).map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="h-16 w-16 rounded-md object-cover border border-white/10" />
                    <button type="button" onClick={() => setForm((p) => ({ ...p, gallery: p.gallery?.filter((_, idx) => idx !== i) }))} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <label className="h-16 w-16 rounded-md border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "gallery"); }} />
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin text-zinc-500" /> : <Plus className="w-4 h-4 text-zinc-500" />}
                </label>
              </div>
            </div>
          </section>

          {/* Specs */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2"><Layers className="w-4 h-4" /> Especificações</h3>
            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="space-y-1"><Label className="text-xs text-zinc-500">Label</Label><Input placeholder="Altura" value={newSpec.label} onChange={(e) => setNewSpec((p) => ({ ...p, label: e.target.value }))} className="bg-black/60 border-white/10 h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs text-zinc-500">Valor</Label><Input placeholder="75mm" value={newSpec.value} onChange={(e) => setNewSpec((p) => ({ ...p, value: e.target.value }))} className="bg-black/60 border-white/10 h-9 text-sm" /></div>
              <Button type="button" onClick={() => { if (newSpec.label) { setForm((p) => ({ ...p, specs: [...(p.specs || []), { ...newSpec }] })); setNewSpec({ label: "", value: "" }); } }} className="bg-white/5 hover:bg-white/10 border border-white/10 h-9">Adicionar</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(form.specs || []).map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-black/40 border border-white/5 rounded-lg group">
                  <span className="text-xs text-zinc-500 flex-1">{spec.label}: <span className="text-white">{spec.value}</span></span>
                  <button type="button" onClick={() => setForm((p) => ({ ...p, specs: p.specs?.filter((_, i) => i !== idx) }))} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </section>

          {/* Colors */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2"><Palette className="w-4 h-4" /> Cores</h3>
            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="space-y-1"><Label className="text-xs text-zinc-500">Nome</Label><Input placeholder="Preto Mate" value={newColor.name} onChange={(e) => setNewColor((p) => ({ ...p, name: e.target.value }))} className="bg-black/60 border-white/10 h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs text-zinc-500">Hex</Label>
                <div className="flex gap-2">
                  <input type="color" value={newColor.hex} onChange={(e) => setNewColor((p) => ({ ...p, hex: e.target.value }))} className="w-9 h-9 p-0 bg-transparent border-none rounded cursor-pointer" />
                  <Input value={newColor.hex} onChange={(e) => setNewColor((p) => ({ ...p, hex: e.target.value }))} className="bg-black/60 border-white/10 h-9 text-sm" />
                </div>
              </div>
              <Button type="button" onClick={() => { if (newColor.name) { setForm((p) => ({ ...p, colors: [...(p.colors || []), { ...newColor }] })); setNewColor({ name: "", hex: "#8B00FF" }); } }} className="bg-white/5 hover:bg-white/10 border border-white/10 h-9">Adicionar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.colors || []).map((c, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-white/5 rounded-full group">
                  <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
                  <span className="text-xs text-zinc-300">{c.name}</span>
                  <button type="button" onClick={() => setForm((p) => ({ ...p, colors: p.colors?.filter((_, i) => i !== idx) }))} className="text-zinc-600 hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-4 border-t border-white/5 flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 border border-white/10 text-zinc-400">Cancelar</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-[#8B00FF] hover:bg-[#7000CC]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {product ? "Salvar Alterações" : "Publicar Produto"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
