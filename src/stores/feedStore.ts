import { create } from 'zustand';

type FeedTab = 'pra_voce' | 'unidade' | 'seguindo';

interface FeedStore {
  activeTab: FeedTab;
  selectedUnitId: string | null; // null = "Todas"
  setActiveTab: (tab: FeedTab) => void;
  setSelectedUnit: (unitId: string | null) => void;
}

export const useFeedStore = create<FeedStore>((set) => ({
  activeTab: 'pra_voce',
  selectedUnitId: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUnit: (unitId) => set({ selectedUnitId: unitId }),
}));
