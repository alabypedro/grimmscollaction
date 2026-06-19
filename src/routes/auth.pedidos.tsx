import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/cart";
import { Loader2, Package, Truck, ChevronRight, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth/pedidos")({
  head: () => ({
    meta: [
      { title: "Meus Pedidos — Grimm's Collection" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PedidosPage,
});

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  aguardando_pagamento: { label: "Aguardando Pagamento", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  pendente: { label: "Pendente", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  processando: { label: "Processando", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  enviado: { label: "Enviado", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  entregue: { label: "Entregue", color: "text-green-400 bg-green-400/10 border-green-400/20" },
  cancelado: { label: "Cancelado", color: "text-red-400 bg-red-400/10 border-red-400/20" },
};

function PedidosPage() {
  const navigate = useNavigate();

  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", session?.user.id],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const { data: items } = await supabase.from("order_items").select("*").in("order_id", (orders ?? []).map((o) => o.id));
      return (orders ?? []).map((o) => ({ ...o, order_items: (items ?? []).filter((i) => i.order_id === o.id) }));
    },
    enabled: !!session,
  });

  if (loadingSession || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    navigate({ to: "/auth/login" });
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/auth/perfil" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black">Meus Pedidos</h1>
            <p className="text-muted-foreground text-sm">{orders.length} pedido{orders.length !== 1 && "s"}</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-xl">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-6">Você ainda não fez nenhum pedido.</p>
            <Link to="/loja" search={{ category: undefined, search: undefined }} className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90 glow-purple">
              Explorar Loja <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const status = STATUS_LABELS[order.status] ?? { label: order.status, color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" };
              return (
                <div key={order.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="p-4 space-y-3">
                    {(order.order_items as any[]).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.product_image && (
                          <img src={item.product_image} alt={item.product_name} className="h-12 w-12 rounded-md object-cover border border-border flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product_name}</p>
                          {item.color && <p className="text-xs text-muted-foreground">{item.color}</p>}
                          <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold flex-shrink-0">{formatBRL(item.total_price)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-4 pb-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                    <div className="space-y-1">
                      {order.shipping_service && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Truck className="h-3.5 w-3.5" />
                          <span>{order.shipping_service}</span>
                        </div>
                      )}
                      {order.tracking_code && (
                        <p className="text-xs">
                          Rastreio: <span className="font-mono text-primary">{order.tracking_code}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total do pedido</p>
                      <p className="font-black text-primary">{formatBRL(order.total)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
