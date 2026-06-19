import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "./products";

function dbRowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    category: row.category,
    material: row.material,
    description: row.description ?? "",
    image_url: row.image_url ?? null,
    gallery: row.gallery ?? [],
    specs: row.specs ?? [],
    colors: row.colors ?? [],
    featured: row.featured ?? false,
    hero: row.hero ?? false,
    popularity: row.popularity ?? 0,
    stock: row.stock ?? 0,
    active: row.active ?? true,
    rating: 0,
    reviews: 0,
  };
}

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("popularity", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(dbRowToProduct);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAllProducts() {
  return useQuery<Product[]>({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(dbRowToProduct);
    },
    staleTime: 1000 * 30,
  });
}

export function useProduct(id: string) {
  return useQuery<Product | null>({
    queryKey: ["products", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return dbRowToProduct(data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
