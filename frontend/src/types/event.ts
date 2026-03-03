import { Timestamp } from 'firebase/firestore'

export type EventStatus = 'planning' | 'active' | 'live' | 'complete' | 'cancelled'
export type BudgetStatus = 'on-track' | 'over-budget' | 'pending'
export type ProposalStatus = 'draft' | 'sent' | 'approved' | 'rejected'

export interface AppEvent {
    id: string
    name: string
    clientName: string
    clientEmail: string
    venue: string
    city: string
    date: Timestamp
    endDate?: Timestamp
    expectedPax: number
    status: EventStatus
    budgetStatus: BudgetStatus
    proposalStatus: ProposalStatus
    createdAt: Timestamp
    createdBy: string
}
