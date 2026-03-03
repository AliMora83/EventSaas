import { Timestamp } from 'firebase/firestore'

export interface LayoutElement {
    type: 'stage' | 'truss' | 'screen' | 'speaker' | 'barrier' | 'table'
    label: string
    x: number
    y: number
    width: number
    height: number
}

export interface Layout {
    id: string
    name: string
    venueWidth: number
    venueDepth: number
    scale: '1:50' | '1:100' | '1:200'
    gridSpacing: number
    fabricJson: string
    thumbnailUrl: string
    elements: LayoutElement[]
    updatedAt: Timestamp
}
