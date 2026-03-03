import { Timestamp } from 'firebase/firestore'

export type BudgetCategory =
    | 'staging' | 'av' | 'lighting' | 'labour' | 'transport'
    | 'catering' | 'permits' | 'decor' | 'other'

export type BudgetLineStatus = 'estimate' | 'quoted' | 'approved' | 'invoiced' | 'paid'

export interface BudgetLine {
    id: string
    eventId: string
    eventName?: string
    category: BudgetCategory
    description: string
    supplier: string
    budgeted: number
    actual: number
    vatRate: number
    quoteRef: string
    status: BudgetLineStatus
    attachmentUrl: string
    notes?: string
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface CategorySummary {
    label: BudgetCategory
    budgeted: number
    actual: number
    pct: number
}
