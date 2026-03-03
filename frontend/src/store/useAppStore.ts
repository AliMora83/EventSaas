import { create } from 'zustand'

interface AppState {
    selectedEventId: string | null
    sidebarCollapsed: boolean
    activeTab: Record<string, string>
    toasts: Toast[]
    setSelectedEvent: (eventId: string | null) => void
    setActiveTab: (page: string, tab: string) => void
    addToast: (toast: Omit<Toast, 'id'>) => void
    removeToast: (id: string) => void
}

export interface Toast {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
}

let toastCounter = 0

export const useAppStore = create<AppState>((set) => ({
    selectedEventId: null,
    sidebarCollapsed: false,
    activeTab: {},
    toasts: [],
    setSelectedEvent: (eventId) => set({ selectedEventId: eventId }),
    setActiveTab: (page, tab) =>
        set((state) => ({ activeTab: { ...state.activeTab, [page]: tab } })),
    addToast: (toast) => {
        const id = String(++toastCounter)
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
        }, 4000)
    },
    removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
