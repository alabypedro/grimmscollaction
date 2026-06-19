export const CATEGORIES = [
  "Miniaturas e Figuras",
  "Cosplay & Acessórios",
  "Decoração e Esculturas",
  "Gadgets e Utilidades",
  "Peças Funcionais",
] as const;

export type Category = (typeof CATEGORIES)[number] | (string & {});

export const MATERIALS = ["PLA", "PETG", "ABS", "Resina", "TPU"] as const;
export type Material = (typeof MATERIALS)[number];

export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  category: Category;
  material: Material;
  popularity: number;
  image_url: string | null;
  gallery: string[];
  description: string;
  specs: { label: string; value: string }[];
  colors: { name: string; hex: string }[];
  featured?: boolean;
  hero?: boolean;
  stock: number;
  active: boolean;
}
