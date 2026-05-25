import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import { CATEGORIES, MATERIALS, type Category, type Material } from "@/lib/products";
import { useAdminStore } from "@/lib/admin-store";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/loja")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      category: (search.category as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Loja — Grimm's Collection" },
      { name: "description", content: "Explore toda a coleção de peças impressas em 3D premium: miniaturas, cosplay, decoração, gadgets e peças funcionais." },
      { property: "og:title", content: "Loja — Grimm's Collection" },
      { property: "og:description", content: "Catálogo completo de impressão 3D premium." },
      { property: "og:url", content: "https://grimmscollaction.lovable.app/loja" },
    ],
    links: [
      { rel: "canonical", href: "https://grimmscollaction.lovable.app/loja" },
    ],
  }),
  component: LojaPage,
});

function LojaPage() {
  const { products, categories: dynamicCategories } = useAdminStore();
  const search = Route.useSearch();
  const [cat, setCat] = useState<string>(search.category || "Todas");
  const [mat, setMat] = useState<Material | "Todos">("Todos");
  const [maxPrice, setMaxPrice] = useState(1000);
  const [sort, setSort] = useState<"popular" | "price-asc" | "price-desc">("popular");

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (cat !== "Todas" && p.category !== cat) return false;
      if (mat !== "Todos" && p.material !== mat) return false;
      if (p.price > maxPrice) return false;
      return true;
    });
    if (sort === "popular") list = [...list].sort((a, b) => b.popularity - a.popularity);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, cat, mat, maxPrice, sort]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-primary font-bold mb-2">CATÁLOGO COMPLETO</p>
        <h1 className="text-4xl md:text-5xl font-black">Loja</h1>
        <p className="text-muted-foreground mt-2">Todos os drops, edições limitadas e clássicos.</p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-10">
        {/* FILTROS */}
        <aside className="space-y-8 lg:sticky lg:top-24 self-start">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <h3 className="text-xs tracking-[0.25em] font-bold">FILTROS</h3>
          </div>

          <FilterGroup title="Categoria">
            {(["Todas", ...dynamicCategories] as const).map((c) => (
              <FilterButton key={c} active={cat === c} onClick={() => setCat(c)}>{c}</FilterButton>
            ))}
          </FilterGroup>

          <FilterGroup title="Material">
            <div className="flex flex-wrap gap-2">
              {(["Todos", ...MATERIALS] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMat(m as Material | "Todos")}
                  className={`px-3 h-8 rounded-md text-xs font-medium border transition-colors ${mat === m ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-foreground"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title={`Preço máximo: R$ ${maxPrice}`}>
            <input
              type="range"
              min={50}
              max={1000}
              step={10}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </FilterGroup>

          <FilterGroup title="Ordenar">
            {[
              { v: "popular", l: "Mais populares" },
              { v: "price-asc", l: "Menor preço" },
              { v: "price-desc", l: "Maior preço" },
            ].map((o) => (
              <FilterButton key={o.v} active={sort === o.v} onClick={() => setSort(o.v as typeof sort)}>{o.l}</FilterButton>
            ))}
          </FilterGroup>
        </aside>

        {/* GRID */}
        <div>
          <p className="text-sm text-muted-foreground mb-6">{filtered.length} produto{filtered.length !== 1 && "s"}</p>
          {filtered.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground">Nenhum produto encontrado com esses filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-foreground">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${active ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}