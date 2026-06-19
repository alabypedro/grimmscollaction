import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminStore {
  heroProductIds: string[];
  setHeroProductIds: (ids: string[]) => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      heroProductIds: [],
      setHeroProductIds: (ids: string[]) => set({ heroProductIds: ids }),
    }),
    { name: 'admin-store-v2' }
  )
);
