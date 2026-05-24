import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Star, Plus, Minus, Shield, Truck, Sparkles } from "lucide-react";
import { type Product } from "@/lib/products";
import { useAdminStore } from "@/lib/admin-store";
import { formatBRL, useCart } from "@/lib/cart";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/produto/$id")({
  loader: ({ params }) => {
    return { id: params.id };
  },
  notFoundComponent: () => (
    <div className="container mx-auto py-32 text-center">
      <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
      <Link to="/loja" className="text-primary hover:underline">Voltar para a loja</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container mx-auto py-32 text-center">
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useLoaderData() as { id: string };
  const { products } = useAdminStore();
  const product = products.find(p => p.id === id);

  if (!product) throw notFound();

  const { add } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [color, setColor] = useState(product.colors[0]?.name);
  const [qty, setQty] = useState(1);

  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16">
      <Link to="/loja" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="h-4 w-4" /> Voltar para a loja
      </Link>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
        {/* GALERIA */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-xl overflow-hidden border border-border bg-card">
            <div className="absolute inset-0 bg-primary/20 blur-3xl -z-10" />
            <img src={product.gallery[activeImg]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {product.gallery.map((g, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${activeImg === i ? "border-primary" : "border-border hover:border-muted-foreground"}`}
              >
                <img src={g} alt={`view ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* INFO */}
        <div className="space-y-6">
          <div>
            <p className="text-xs tracking-[0.3em] text-primary font-bold mb-3">{product.category.toUpperCase()}</p>
            <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                ))}
              </div>
              <span className="text-muted-foreground">{product.rating} · {product.reviews} avaliações</span>
            </div>
          </div>

          <p className="text-4xl font-black text-gradient">{formatBRL(product.price)}</p>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="space-y-3">
            <p className="text-xs tracking-[0.2em] font-bold text-muted-foreground">COR / MATERIAL</p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={`flex items-center gap-2 pl-2 pr-4 py-2 rounded-full border transition-colors ${color === c.name ? "border-primary bg-primary/10" : "border-border hover:border-primary"}`}
                >
                  <span className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                  <span className="text-xs font-medium">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center border border-border rounded-md h-12">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-12 w-12 grid place-items-center hover:bg-secondary"><Minus className="h-4 w-4" /></button>
              <span className="w-12 text-center font-bold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="h-12 w-12 grid place-items-center hover:bg-secondary"><Plus className="h-4 w-4" /></button>
            </div>
            <button
              onClick={() => add(product, qty, color)}
              className="flex-1 h-12 rounded-md bg-primary text-primary-foreground font-bold tracking-wide hover:opacity-90 glow-purple"
            >
              ADICIONAR AO CARRINHO
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4">
            {[
              { I: Shield, l: "Garantia 30d" },
              { I: Truck, l: "Envio 48h" },
              { I: Sparkles, l: "Edição premium" },
            ].map(({ I, l }) => (
              <div key={l} className="flex flex-col items-center gap-1 p-3 rounded-md border border-border bg-card/40 text-center">
                <I className="h-4 w-4 text-primary" />
                <span className="text-[11px] text-muted-foreground">{l}</span>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-border">
            <p className="text-xs tracking-[0.2em] font-bold text-muted-foreground mb-4">ESPECIFICAÇÕES TÉCNICAS</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.specs.map((s) => (
                <div key={s.label} className="flex justify-between py-2 border-b border-border/60">
                  <dt className="text-sm text-muted-foreground">{s.label}</dt>
                  <dd className="text-sm font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="text-2xl md:text-3xl font-black mb-8">Você também pode gostar</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}