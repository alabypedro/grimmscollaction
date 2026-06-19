import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/cart";
import { CheckCircle2, Clock, Loader2, Package, Truck, ArrowRight, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/pedido-confirmado")({
  validateSearch: (s: Record<string, unknown>) => ({
    orderId: s.orderId as string,
    payment_status: (s.payment_status as string | undefined),
  }),
  head: () => ({
    meta: [
      { title: "Pedido Recebido — Grimm's Collection" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmacaoPage,
});

function ConfirmacaoPage() {
  const { orderId, payment_status } = Route.useSearch();
  const isPending = payment_status === "pending";

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const [orderRes, itemsRes] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).single(),
        supabase.from("order_items").select("*").eq("order_id", orderId),
      ]);
      if (orderRes.error) throw orderRes.error;
      return { ...orderRes.data, order_items: itemsRes.data ?? [] };
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isApproved = !isPending && order?.status !== "aguardando_pagamento";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full space-y-8 text-center">
        <div className="flex justify-center">
          {isPending ? (
            <div className="h-20 w-20 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
              <Clock className="h-10 w-10 text-yellow-400" />
            </div>
          ) : isApproved ? (
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <AlertCircle className="h-10 w-10 text-blue-400" />
            </div>
          )}
        </div>

        <div>
          {isPending ? (
            <>
              <h1 className="text-3xl font-black mb-2">Pagamento Pendente</h1>
              <p className="text-muted-foreground">
                Seu pedido foi criado! Após a confirmação do pagamento, você receberá um e-mail e o status será atualizado automaticamente.
              </p>
            </>
          ) : isApproved ? (
            <>
              <h1 className="text-3xl font-black mb-2">Pedido Confirmado!</h1>
              <p className="text-muted-foreground">
                Pagamento aprovado. Você receberá atualizações sobre o envio por e-mail.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black mb-2">Pedido Recebido</h1>
              <p className="text-muted-foreground">
                Seu pedido foi registrado e está aguardando confirmação do pagamento.
              </p>
            </>
          )}
        </div>

        {order && (
          <div className="bg-card border border-border rounded-xl p-6 text-left space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pedido #</span>
              <span className="font-mono font-bold text-xs">{order.id.slice(0, 8).toUpperCase()}</span>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
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
                  <p className="text-sm font-bold">{formatBRL(item.total_price)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatBRL(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Frete</span>
                <span>{formatBRL(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between font-black text-base border-t border-border pt-2">
                <span>Total</span>
                <span className="text-primary">{formatBRL(order.total)}</span>
              </div>
            </div>

            {order.shipping_service && (
              <div className="flex items-center gap-2 text-sm bg-background/40 border border-border rounded-lg p-3">
                <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">{order.shipping_service}</p>
                  {order.shipping_deadline && <p className="text-muted-foreground text-xs">{order.shipping_deadline}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/auth/pedidos" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md border border-border hover:border-primary text-sm font-bold transition-colors">
            <Package className="h-4 w-4" /> Meus Pedidos
          </Link>
          <Link to="/loja" search={{ category: undefined, search: undefined }} className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 glow-purple transition-all">
            Continuar Comprando <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
