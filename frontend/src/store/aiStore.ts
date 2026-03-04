import { create } from "zustand";

interface AIStore {
    isOpen: boolean;
    activeTab: "estimate" | "savings";
    openDrawer: (tab?: "estimate" | "savings") => void;
    closeDrawer: () => void;
}

export const useAIStore = create<AIStore>((set) => ({
    isOpen: false,
    activeTab: "estimate",
    openDrawer: (tab = "estimate") => set({ isOpen: true, activeTab: tab }),
    closeDrawer: () => set({ isOpen: false }),
}));
