import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PRODUCTS, Product } from './products';

interface AdminStore {
  products: Product[];
  categories: string[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  heroProductIds: string[];
  setHeroProductIds: (ids: string[]) => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      products: PRODUCTS,
      heroProductIds: PRODUCTS.slice(0, 3).map(p => p.id),
      categories: [
        "Miniaturas e Figuras",
        "Cosplay & Acessórios",
        "Decoração e Esculturas",
        "Gadgets e Utilidades",
        "Peças Funcionais",
      ],
      addProduct: (product: Product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (product: Product) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === product.id ? product : p)),
        })),
      deleteProduct: (id: string) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
      addCategory: (category: string) => 
        set((state) => ({ 
          categories: state.categories.includes(category) 
            ? state.categories 
            : [...state.categories, category] 
        })),
      deleteCategory: (category: string) =>
        set((state) => ({
          categories: state.categories.filter((c) => c !== category)
        })),
      setHeroProductIds: (ids: string[]) => set({ heroProductIds: ids }),
    }),
    {
      name: 'admin-products-storage',
    }
  )
);
