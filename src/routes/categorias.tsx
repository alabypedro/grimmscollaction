import { createFileRoute, Link } from "@tanstack/react-router";
import { PRODUCTS } from "@/lib/products";
import { useAdminStore } from "@/lib/admin-store";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias — Grimm's Collection" },
      { name: "description", content: "Explore as categorias de impressão 3D: miniaturas, cosplay, decoração, gadgets e peças funcionais." },
      { property: "og:title", content: "Categorias — Grimm's Collection" },
      { property: "og:description", content: "Universos curados da Grimm's Collection." },
      { property: "og:url", content: "https://grimmscollaction.lovable.app/categorias" },
    ],
    links: [
      { rel: "canonical", href: "https://grimmscollaction.lovable.app/categorias" },
    ],
  }),
  component: CategoriasPage,
});

function CategoriasPage() {
  const { products, categories } = useAdminStore();
  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
      <div className="mb-12">
        <p className="text-xs tracking-[0.3em] text-primary font-bold mb-2">EXPLORE POR UNIVERSO</p>
        <h1 className="text-4xl md:text-5xl font-black">Categorias</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">Cada categoria é um universo. Curadoria rigorosa para colecionadores exigentes.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <h2 className="sr-only">Lista de categorias</h2>
        {categories.map((c, i) => {
          const sample = products.find(p => p.category === c) || products[0];
          const count = products.filter((p) => p.category === c).length;
          return (
            <Link
              key={c}
              to="/loja"
              search={{ category: c }}
              className="group relative h-72 rounded-xl overflow-hidden border border-border card-hover"
            >
              <img src={sample.image} alt={c} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/40 to-transparent" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <p className="text-xs tracking-[0.25em] text-primary font-bold mb-2">{count} PEÇA{count !== 1 && "S"}</p>
                <h3 className="text-2xl md:text-3xl font-black mb-3 group-hover:text-primary transition-colors">{c}</h3>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80">
                  Explorar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}