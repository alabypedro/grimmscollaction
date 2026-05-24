import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PRODUCTS, Product } from './products';

interface AdminStore {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      products: PRODUCTS,
      addProduct: (product: Product) => set((state: AdminStore) => ({ products: [...state.products, product] })),
      updateProduct: (product: Product) =>
        set((state: AdminStore) => ({
          products: state.products.map((p) => (p.id === product.id ? product : p)),
        })),
      deleteProduct: (id: string) =>
        set((state: AdminStore) => ({ products: state.products.filter((p) => p.id !== id) })),
    }),
    {
      name: 'admin-products-storage',
    }
  )
);
