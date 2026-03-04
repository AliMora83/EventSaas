import { Timestamp } from 'firebase/firestore'

export type ElementType = 'select' | 'stage' | 'truss' | 'screen' | 'speaker' | 'barrier' | 'table' | 'foh' | 'generator' | 'toilet' | 'entrance'

export interface CanvasElement {
    id: string
    type: ElementType
    label: string
    x: number
    y: number
    width: number
    height: number
    color: string
    strokeColor: string
    rotation?: number
    notes?: string
    source?: 'manual' | 'ai-generated'
}

export interface LayoutResult {
    layoutName: string
    summary: string
    technicalNotes: string
    elements: CanvasElement[]
    stagingAdvice: string[]
}

export interface GenerateLayoutParams {
    description?: string
    venueWidth: number
    venueDepth: number
    pax: number
    eventType: string
    city: string
    canvasWidth: number
    canvasHeight: number
    scale: number
}

export interface Layout {
    id: string
    name: string
    eventId?: string
    venueWidth: number
    venueDepth: number
    scale: '1:50' | '1:100' | '1:200'
    gridSpacing: number
    thumbnailUrl: string
    elements: CanvasElement[]
    updatedAt: Timestamp

    // AI Specific properties for SavedLayout concept
    summary?: string
    technicalNotes?: string
    stagingAdvice?: string[]
    source?: 'manual' | 'ai-generated'
    createdBy?: string
}
