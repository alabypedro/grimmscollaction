import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart, formatBRL } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { calculateShipping, estimatePackage, type ShippingOption } from "@/lib/melhor-envio";
import { Loader2, MapPin, Package, CreditCard, ChevronRight, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar Compra — Grimm's Collection" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type Step = "address" | "shipping" | "review";

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();

  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const [step, setStep] = useState<Step>("address");
  const [submitting, setSubmitting] = useState(false);

  const [address, setAddress] = useState({
    name: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });
  const [loadingCep, setLoadingCep] = useState(false);

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  if (loadingSession) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!session) {
    navigate({ to: "/auth/login", search: { redirect: "/checkout" } });
    return null;
  }

  if (items.length === 0) {
    navigate({ to: "/loja", search: { category: undefined, search: undefined } });
    return null;
  }

  async function lookupCep(cep: string) {
    const cleaned = cep.replace(/\D/g, "");
    if (cleaned.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress((prev) => ({
          ...prev,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
        }));
      }
    } catch {
      // silent
    } finally {
      setLoadingCep(false);
    }
  }

  async function fetchShipping() {
    setLoadingShipping(true);
    try {
      const pkgParams = estimatePackage(items.map((i) => ({ qty: i.qty })));
      const options = await calculateShipping({
        from_cep: import.meta.env.VITE_ORIGIN_CEP || "01310-100",
        to_cep: address.cep,
        ...pkgParams,
      });
      setShippingOptions(options);
      if (options.length > 0) setSelectedShipping(options[0]);
      setStep("shipping");
    } catch {
      toast.error("Não foi possível calcular o frete. Tente novamente.");
    } finally {
      setLoadingShipping(false);
    }
  }

  async function placeOrder() {
    if (!session || !selectedShipping) return;
    setSubmitting(true);
    try {
      const orderTotal = total + selectedShipping.price;

      // 1. Criar pedido com status aguardando_pagamento
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: session.user.id,
          status: "aguardando_pagamento",
          subtotal: total,
          shipping_cost: selectedShipping.price,
          total: orderTotal,
          shipping_service: `${selectedShipping.company} — ${selectedShipping.name}`,
          shipping_deadline: `${selectedShipping.delivery_range.min}–${selectedShipping.delivery_range.max} dias úteis`,
          shipping_name: address.name,
          shipping_cep: address.cep,
          shipping_address: address.street,
          shipping_number: address.number,
          shipping_complement: address.complement,
          shipping_neighborhood: address.neighborhood,
          shipping_city: address.city,
          shipping_state: address.state,
          payment_method: "mercadopago",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image_url,
        color: item.color || null,
        quantity: item.qty,
        unit_price: item.product.price,
        total_price: item.product.price * item.qty,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // 2. Criar preferência no MercadoPago
      const mpItems = items.map((item) => ({
        id: item.product.id,
        title: item.product.name + (item.color ? ` (${item.color})` : ""),
        quantity: item.qty,
        unit_price: item.product.price,
      }));

      const prefRes = await fetch("/api/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          items: mpItems,
          payerEmail: session.user.email,
          siteUrl: window.location.origin,
        }),
      });

      const prefData = await prefRes.json() as any;

      if (!prefRes.ok) {
        // Pedido foi criado mas MP falhou — avisa o usuário e não limpa o carrinho
        toast.error(prefData.error || "Erro ao conectar com MercadoPago.");
        setSubmitting(false);
        return;
      }

      // 3. Salvar preference_id no pedido
      await supabase.from("orders").update({ mp_preference_id: prefData.preferenceId }).eq("id", order.id);

      // 4. Limpar carrinho e redirecionar para MP
      clear();
      const isSandbox = prefData.initPoint?.includes("sandbox") || import.meta.env.DEV;
      const redirectUrl = isSandbox ? prefData.sandboxInitPoint : prefData.initPoint;
      window.location.href = redirectUrl;
    } catch (err: any) {
      toast.error(err.message || "Erro ao finalizar pedido.");
      setSubmitting(false);
    }
  }

  const shippingTotal = selectedShipping?.price ?? 0;
  const orderTotal = total + shippingTotal;

  const STEPS: Step[] = ["address", "shipping", "review"];
  const STEP_LABELS: Record<Step, string> = { address: "ENDEREÇO", shipping: "FRETE", review: "CONFIRMAR" };

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black mb-2">Finalizar Compra</h1>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-10 text-xs font-bold tracking-wider">
          {STEPS.map((s, i) => {
            const stepIdx = STEPS.indexOf(step);
            const done = i < stepIdx;
            const active = s === step;
            return (
              <span key={s} className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border ${active ? "bg-primary text-white border-primary" : done ? "bg-primary/30 text-primary border-primary/30" : "bg-transparent text-muted-foreground border-border"}`}>
                  {i + 1}
                </span>
                <span className={active ? "text-primary" : done ? "text-primary/60" : "text-muted-foreground"}>{STEP_LABELS[s]}</span>
                {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              </span>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          {/* FORM */}
          <div className="space-y-6">
            {/* Step 1: Endereço */}
            {step === "address" && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="font-bold text-lg">Endereço de Entrega</h2>
                </div>

                <div className="space-y-2">
                  <Label>Nome completo *</Label>
                  <Input value={address.name} onChange={(e) => setAddress((p) => ({ ...p, name: e.target.value }))} placeholder="Seu nome completo" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CEP *</Label>
                    <div className="relative">
                      <Input
                        value={address.cep}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                          const fmt = v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
                          setAddress((p) => ({ ...p, cep: fmt }));
                          if (v.length === 8) lookupCep(v);
                        }}
                        placeholder="00000-000"
                      />
                      {loadingCep && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input value={address.state} onChange={(e) => setAddress((p) => ({ ...p, state: e.target.value }))} placeholder="SP" maxLength={2} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rua / Logradouro *</Label>
                  <Input value={address.street} onChange={(e) => setAddress((p) => ({ ...p, street: e.target.value }))} placeholder="Rua, Avenida..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número *</Label>
                    <Input value={address.number} onChange={(e) => setAddress((p) => ({ ...p, number: e.target.value }))} placeholder="123" />
                  </div>
                  <div className="space-y-2">
                    <Label>Complemento</Label>
                    <Input value={address.complement} onChange={(e) => setAddress((p) => ({ ...p, complement: e.target.value }))} placeholder="Apto, Bloco..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bairro *</Label>
                    <Input value={address.neighborhood} onChange={(e) => setAddress((p) => ({ ...p, neighborhood: e.target.value }))} placeholder="Bairro" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade *</Label>
                    <Input value={address.city} onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))} placeholder="São Paulo" />
                  </div>
                </div>

                <Button
                  onClick={fetchShipping}
                  disabled={!address.name || !address.cep || !address.street || !address.number || !address.city || loadingShipping}
                  className="w-full bg-primary hover:bg-primary/90 h-12 font-bold"
                >
                  {loadingShipping ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Calculando frete...</> : "CONTINUAR — CALCULAR FRETE"}
                </Button>
              </div>
            )}

            {/* Step 2: Frete */}
            {step === "shipping" && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-5 w-5 text-primary" />
                  <h2 className="font-bold text-lg">Opções de Frete</h2>
                </div>

                <div className="text-sm text-muted-foreground mb-4">
                  Entrega para: <span className="text-foreground font-medium">{address.city} — {address.cep}</span>
                </div>

                <div className="space-y-3">
                  {shippingOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedShipping(opt)}
                      className={`w-full p-4 rounded-lg border text-left transition-colors flex items-center justify-between ${selectedShipping?.id === opt.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                    >
                      <div>
                        <p className="font-bold">{opt.company} — {opt.name}</p>
                        <p className="text-sm text-muted-foreground">{opt.delivery_range.min}–{opt.delivery_range.max} dias úteis</p>
                      </div>
                      <span className="font-bold text-primary">{formatBRL(opt.price)}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep("address")} className="flex-1">Voltar</Button>
                  <Button onClick={() => setStep("review")} disabled={!selectedShipping} className="flex-1 bg-primary hover:bg-primary/90 font-bold">
                    CONTINUAR
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Revisar e Pagar */}
            {step === "review" && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="font-bold text-lg">Revisar e Pagar</h2>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-background/40 rounded-lg border border-border space-y-1">
                    <p className="font-bold text-xs tracking-wider text-muted-foreground">ENDEREÇO</p>
                    <p>{address.name}</p>
                    <p>{address.street}, {address.number}{address.complement ? ` — ${address.complement}` : ""}</p>
                    <p>{address.neighborhood} — {address.city}/{address.state} — {address.cep}</p>
                  </div>
                  <div className="p-3 bg-background/40 rounded-lg border border-border space-y-1">
                    <p className="font-bold text-xs tracking-wider text-muted-foreground">FRETE</p>
                    <p>{selectedShipping?.company} — {selectedShipping?.name}</p>
                    <p className="text-muted-foreground">{selectedShipping?.delivery_range.min}–{selectedShipping?.delivery_range.max} dias úteis</p>
                  </div>
                </div>

                {/* MercadoPago payment info */}
                <div className="p-4 bg-[#009EE3]/10 border border-[#009EE3]/30 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#009EE3]" />
                    <p className="text-sm font-bold text-[#009EE3]">Pagamento seguro via Mercado Pago</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Você será redirecionado para o Mercado Pago onde poderá pagar com cartão de crédito, débito, boleto ou PIX.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {["Visa", "Mastercard", "Elo", "Pix", "Boleto"].map((m) => (
                      <span key={m} className="text-[10px] font-bold px-2 py-0.5 rounded bg-background/60 border border-border text-muted-foreground">{m}</span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep("shipping")} className="flex-1">Voltar</Button>
                  <Button
                    onClick={placeOrder}
                    disabled={submitting}
                    className="flex-1 h-12 font-bold text-white"
                    style={{ backgroundColor: "#009EE3" }}
                  >
                    {submitting
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                      : "PAGAR COM MERCADO PAGO"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ORDER SUMMARY */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 self-start sticky top-24">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Resumo do Pedido</h2>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3">
                  <img src={item.product.image_url ?? "/products/product-1.jpg"} alt={item.product.name} className="h-14 w-14 rounded-md object-cover border border-border flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    {item.color && <p className="text-xs text-muted-foreground">{item.color}</p>}
                    <p className="text-xs text-muted-foreground">Qtd: {item.qty}</p>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0">{formatBRL(item.product.price * item.qty)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatBRL(total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Frete</span>
                <span>{selectedShipping ? formatBRL(shippingTotal) : "—"}</span>
              </div>
              <div className="flex justify-between font-black text-lg border-t border-border pt-2">
                <span>Total</span>
                <span className="text-primary">{formatBRL(orderTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
