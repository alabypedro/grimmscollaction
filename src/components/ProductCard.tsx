import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { StarRating } from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/lib/products";
import { formatBRL } from "@/lib/cart";

export function ProductCard({ product }: { product: Product }) {
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", product.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("rating")
        .eq("product_id", product.id);
      return data || [];
    },
  });

  const ratingStats = reviews.length > 0
    ? {
        average: (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1),
        count: reviews.length
      }
    : { average: product.rating.toString(), count: product.reviews };

  return (
    <Link
      to="/produto/$id"
      params={{ id: product.id }}
      className="group block bg-card border border-border rounded-lg overflow-hidden card-hover"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary/40">
        <img
          src={product.image}
          alt={`Peça impressa em 3D: ${product.name}`}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-primary/10" />
        <span className="absolute top-3 left-3 text-[10px] font-bold tracking-[0.2em] px-2.5 py-1 rounded-sm bg-background/80 backdrop-blur border border-border text-muted-foreground">
          {product.material}
        </span>
      </div>
      <div className="p-5 space-y-2">
        <p className="text-[10px] tracking-[0.25em] text-primary font-bold">{product.category.toUpperCase()}</p>
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
        <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
          <StarRating rating={Number(ratingStats.average)} readonly size="sm" />
          <span className="ml-1">{ratingStats.average}</span>
          <span className="text-muted-foreground font-normal">({ratingStats.count})</span>
        </div>
        <div className="flex items-end justify-between pt-2">
          <span className="text-lg font-bold text-foreground">{formatBRL(product.price)}</span>
          <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">Ver detalhes →</span>
        </div>
      </div>
    </Link>
  );
}