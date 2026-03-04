import { create } from 'zustand'
import { CanvasElement, LayoutResult } from '@/types/layout'

interface LayoutStore {
    elements: CanvasElement[]
    selectedId: string | null
    lastAIResult: LayoutResult | null
    previousElements: CanvasElement[] // for undo AI generation

    setElements: (els: CanvasElement[]) => void
    addElement: (el: CanvasElement) => void
    updateElement: (id: string, updates: Partial<CanvasElement>) => void
    deleteElement: (id: string) => void
    selectElement: (id: string | null) => void
    applyAILayout: (result: LayoutResult, activeToolMapping: Record<string, { fill: string; stroke: string }>) => void
    undoAILayout: () => void
    clearCanvas: () => void
}

export const useLayoutStore = create<LayoutStore>((set) => ({
    elements: [],
    selectedId: null,
    lastAIResult: null,
    previousElements: [],

    setElements: (els) => set({ elements: els }),

    addElement: (el) => set((state) => ({
        elements: [...state.elements, el]
    })),

    updateElement: (id, updates) => set((state) => ({
        elements: state.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    })),

    deleteElement: (id) => set((state) => ({
        elements: state.elements.filter(el => el.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId
    })),

    selectElement: (id) => set({ selectedId: id }),

    applyAILayout: (result, activeToolMapping) => set((state) => {
        // Map the correct colors before saving to elements
        const correctlyColoredElements = result.elements.map(el => {
            const mapping = activeToolMapping[el.type]
            if (mapping) {
                return { ...el, color: mapping.fill, strokeColor: mapping.stroke }
            }
            return el
        })

        return {
            previousElements: state.elements, // Save current state for undo
            elements: correctlyColoredElements,
            lastAIResult: {
                ...result,
                elements: correctlyColoredElements // Make sure lastAIResult reflects colored version too
            }
        }
    }),

    undoAILayout: () => set((state) => ({
        elements: state.previousElements,
        lastAIResult: null,
        previousElements: []
    })),

    clearCanvas: () => set({
        elements: [],
        selectedId: null,
        lastAIResult: null
    }),
}))
