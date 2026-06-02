import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Shield, Truck, Zap, Star, Quote, Search } from "lucide-react";
import hero from "@/assets/hero-product.jpg";
import { CATEGORIES } from "@/lib/products";
import { useAdminStore } from "@/lib/admin-store";
import { ProductCard } from "@/components/ProductCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Grimm's Collection — Impressão 3D Premium" },
      { name: "description", content: "Descubra peças impressas em 3D de alta qualidade: miniaturas, cosplay, decoração e gadgets exclusivos." },
      { property: "og:title", content: "Grimm's Collection — Impressão 3D Premium" },
      { property: "og:description", content: "Loja premium de impressão 3D." },
      { property: "og:url", content: "https://grimmscollaction.lovable.app/" },
    ],
    links: [
      { rel: "canonical", href: "https://grimmscollaction.lovable.app/" },
    ],
  }),
  component: Index,
});

function Index() {
  const { products, categories: dynamicCategories } = useAdminStore();
  const featured = products.filter((p) => p.featured);
  const [stats, setStats] = useState({ avgRating: 4.9, totalReviews: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating');
      
      if (data && data.length > 0) {
        const total = data.length;
        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
        setStats({
          avgRating: Number((sum / total).toFixed(1)),
          totalReviews: total
        });
      }
    };

    fetchStats();
  }, []);
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/50 backdrop-blur text-xs tracking-[0.2em] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                NOVA COLEÇÃO · INVERNO 2026
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95]">
                Esculpido em <br />
                <span className="text-gradient">sombras</span>. <br />
                Impresso em <span className="text-gradient">precisão</span>.
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Peças exclusivas impressas em 3D de alta resolução. Para colecionadores, cosplayers e mentes inquietas que exigem o impossível.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/loja"
                  className="group inline-flex items-center gap-2 h-14 px-8 rounded-md bg-primary text-primary-foreground font-bold tracking-wide hover:opacity-90 glow-purple transition-all"
                >
                  EXPLORAR COLEÇÃO
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/sobre"
                  className="inline-flex items-center gap-2 h-14 px-8 rounded-md border border-border hover:border-primary hover:text-primary font-medium tracking-wide transition-all"
                >
                  Nossa história
                </Link>
              </div>
              <div className="flex items-center gap-8 pt-6">
                <div>
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-xs text-muted-foreground tracking-wide">Peças entregues</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.avgRating}★</p>
                  <p className="text-xs text-muted-foreground tracking-wide flex flex-col">
                    <span className="text-[10px] opacity-70">
                      ({stats.totalReviews} {stats.totalReviews === 1 ? 'avaliação' : 'avaliações'})
                    </span>
                    Avaliação média
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">48h</p>
                  <p className="text-xs text-muted-foreground tracking-wide">Envio rápido</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-[120px] rounded-full" />
              <img
                src={hero}
                alt="Crânio de dragão impresso em 3D"
                width={1536}
                height={1536}
                className="relative rounded-2xl border border-border shadow-2xl animate-float w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-card/90 backdrop-blur-xl border border-border rounded-xl p-4 shadow-2xl hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 grid place-items-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Edição limitada</p>
                    <p className="text-sm font-bold">Apenas 500 unidades</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="container mx-auto px-4 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.3em] text-primary font-bold mb-2">EXPLORE</p>
            <h2 className="text-3xl md:text-4xl font-black">Categorias</h2>
          </div>
          <Link to="/categorias" className="text-sm text-muted-foreground hover:text-primary">Ver todas →</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {dynamicCategories.map((c, i) => (
            <Link
              key={c}
              to="/loja"
              search={{ category: c }}
              className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-card border border-border card-hover"
            >
              <img
                src={products.find(p => p.category === c)?.image || products[0]?.image}
                alt={c}
                loading="lazy"
                className="h-full w-full object-cover opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{c}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PRODUTOS EM DESTAQUE */}
      <section className="container mx-auto px-4 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.3em] text-primary font-bold mb-2">DROPS DA SEMANA</p>
            <h2 className="text-3xl md:text-4xl font-black">Produtos em destaque</h2>
          </div>
          <Link to="/loja" className="text-sm text-muted-foreground hover:text-primary">Ver loja →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="container mx-auto px-4 lg:px-8 py-20">
        <div className="relative rounded-2xl border border-border bg-card/40 backdrop-blur p-10 md:p-16 overflow-hidden">
          <div className="absolute inset-0 -z-10 opacity-50" style={{ background: "var(--gradient-radial)" }} />
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs tracking-[0.3em] text-primary font-bold mb-2">POR QUE GRIMM'S</p>
            <h2 className="text-3xl md:text-4xl font-black">Obsessão pelo detalhe</h2>
            <p className="text-muted-foreground mt-3">Cada peça passa por inspeção manual, acabamento artesanal e curadoria rigorosa.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { I: Shield, t: "Qualidade Garantida", d: "Resinas e filamentos premium, testados em condições extremas." },
              { I: Zap, t: "Detalhamento 8K", d: "Impressoras de alta resolução para texturas absurdamente nítidas." },
              { I: Truck, t: "Envio em 48h", d: "Despachamos rápido. Embalagem reforçada e protegida." },
            ].map(({ I, t, d }) => (
              <div key={t} className="group p-6 rounded-lg border border-border bg-background/40 hover:border-primary transition-all">
                <div className="h-12 w-12 rounded-lg bg-primary/15 grid place-items-center mb-4 group-hover:bg-primary/30 transition-colors">
                  <I className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="container mx-auto px-4 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] text-primary font-bold mb-2">A COMUNIDADE FALA</p>
          <h2 className="text-3xl md:text-4xl font-black">O que dizem nossos clientes</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "Marina S.", r: "Cosplayer", t: "O acabamento do helm é de outro nível. Encaixe perfeito e LEDs maravilhosos. Vou voltar com certeza." },
            { n: "Diego R.", r: "Colecionador RPG", t: "Miniaturas com nível de detalhe que eu só vi em estúdios europeus. A Grimm's elevou o padrão." },
            { n: "Tatiana L.", r: "Designer de interiores", t: "A luminária hexagonal virou peça central da sala. Indico para todos os meus projetos." },
          ].map((d) => (
            <div key={d.n} className="p-6 rounded-lg border border-border bg-card relative">
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 mb-4">"{d.t}"</p>
              <div className="pt-3 border-t border-border">
                <p className="font-bold text-sm">{d.n}</p>
                <p className="text-xs text-muted-foreground">{d.r}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
