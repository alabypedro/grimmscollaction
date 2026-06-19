import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, Minus, Shield, Truck, Sparkles, Send, Loader2 } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useProduct, useProducts } from "@/lib/use-products";
import { formatBRL, useCart } from "@/lib/cart";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/produto/$id")({
  loader: ({ params }) => ({ id: params.id }),
  head: ({ params }) => {
    const url = `https://grimmscollaction.lovable.app/produto/${params.id}`;
    return {
      meta: [
        { title: `Produto — Grimm's Collection` },
        { name: "description", content: "Peça impressa em 3D premium da Grimm's Collection." },
        { property: "og:url", content: url },
        { property: "og:type", content: "product" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: () => (
    <div className="container mx-auto py-32 text-center">
      <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
      <Link to="/loja" search={{ category: undefined, search: undefined }} className="text-primary hover:underline">Voltar para a loja</Link>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const { data: product, isLoading } = useProduct(id);
  const { data: allProducts = [] } = useProducts();
  const { add } = useCart();

  const [activeImg, setActiveImg] = useState(0);
  const [color, setColor] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, profiles(username, full_name, avatar_url)")
        .eq("product_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("Você precisa estar logado para avaliar.");
      const { error } = await supabase.from("reviews").upsert({
        product_id: id,
        user_id: session.user.id,
        rating: newRating,
        comment: newComment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      toast.success("Avaliação enviada com sucesso!");
      setNewComment("");
    },
    onError: (error: any) => {
      toast.error(error.code === "23505" ? "Você já avaliou este produto." : error.message || "Erro ao enviar avaliação.");
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-32 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) throw notFound();

  const selectedColor = color ?? product.colors[0]?.name;
  const gallery = product.gallery.length > 0 ? product.gallery : [product.image_url ?? "/products/product-1.jpg"];
  const related = allProducts.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  const ratingStats = reviews.length > 0
    ? {
        average: (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1),
        count: reviews.length,
      }
    : { average: "0", count: 0 };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16">
      <Link to="/loja" search={{ category: undefined, search: undefined }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="h-4 w-4" /> Voltar para a loja
      </Link>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
        {/* GALERIA */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-xl overflow-hidden border border-border bg-card">
            <div className="absolute inset-0 bg-primary/20 blur-3xl -z-10" />
            <img src={gallery[activeImg]} alt={`Peça impressa em 3D: ${product.name}`} className="h-full w-full object-cover" />
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Ver imagem ${i + 1}`}
                  className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${activeImg === i ? "border-primary" : "border-border hover:border-muted-foreground"}`}
                >
                  <img src={g} alt={`${product.name} imagem ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="space-y-6">
          <div>
            <p className="text-xs tracking-[0.3em] text-primary font-bold mb-3">{product.category.toUpperCase()}</p>
            <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-3 text-sm">
              <StarRating rating={Number(ratingStats.average)} readonly size="sm" />
              <span className="text-muted-foreground">{ratingStats.average} · {ratingStats.count} avaliações</span>
            </div>
          </div>

          <p className="text-4xl font-black text-gradient">{formatBRL(product.price)}</p>
          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          {product.colors.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs tracking-[0.2em] font-bold text-muted-foreground">COR / MATERIAL</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    className={`flex items-center gap-2 pl-2 pr-4 py-2 rounded-full border transition-colors ${selectedColor === c.name ? "border-primary bg-primary/10" : "border-border hover:border-primary"}`}
                  >
                    <span className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                    <span className="text-xs font-medium">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {product.stock > 0 ? (
              <p className="text-sm text-green-500 font-medium">{product.stock} em estoque</p>
            ) : (
              <p className="text-sm text-red-500 font-medium">Fora de estoque</p>
            )}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border rounded-md h-12">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuir quantidade" className="h-12 w-12 grid place-items-center hover:bg-secondary">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-bold">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))} aria-label="Aumentar quantidade" className="h-12 w-12 grid place-items-center hover:bg-secondary">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => add(product, qty, selectedColor)}
                disabled={product.stock === 0}
                className="flex-1 h-12 rounded-md bg-primary text-primary-foreground font-bold tracking-wide hover:opacity-90 glow-purple disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ADICIONAR AO CARRINHO
              </button>
            </div>
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

          {product.specs.length > 0 && (
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
          )}
        </div>
      </div>

      {/* AVALIAÇÕES */}
      <section className="mt-24 border-t border-border pt-16">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Avaliações de Clientes</h2>
            <div className="flex items-center gap-4">
              <span className="text-5xl font-black">{ratingStats.average}</span>
              <div>
                <StarRating rating={Number(ratingStats.average)} readonly size="md" />
                <p className="text-sm text-muted-foreground">Com base em {ratingStats.count} avaliações</p>
              </div>
            </div>

            {session ? (
              <div className="p-6 rounded-xl border border-border bg-card/40 space-y-4">
                <h3 className="font-bold">Deixe sua avaliação</h3>
                <StarRating rating={newRating} onRatingChange={setNewRating} size="lg" />
                <textarea
                  placeholder="O que você achou do produto?"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full h-32 bg-background/50 border border-border rounded-md p-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                />
                <button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-md flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  PUBLICAR AVALIAÇÃO
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-border bg-card/40 text-center space-y-3">
                <p className="text-sm text-muted-foreground">Você precisa estar logado para avaliar.</p>
                <Link to="/auth/login" className="text-primary font-bold hover:underline">Fazer Login →</Link>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-8">
            {isLoadingReviews ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : reviews.length > 0 ? (
              <div className="grid gap-6">
                {reviews.map((r: any) => (
                  <div key={r.id} className="p-6 rounded-xl border border-border bg-card/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 overflow-hidden border border-border">
                          {r.profiles?.avatar_url ? (
                            <img src={r.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] font-bold">
                              {r.profiles?.full_name?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{r.profiles?.full_name || r.profiles?.username || "Usuário"}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                      <StarRating rating={r.rating} readonly size="sm" />
                    </div>
                    {r.comment && <p className="text-sm text-foreground/80 leading-relaxed italic">"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">Este produto ainda não possui avaliações.</p>
              </div>
            )}
          </div>
        </div>
      </section>

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
