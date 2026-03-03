import { Timestamp } from 'firebase/firestore'

export type SectionStatus = 'pending' | 'approved'

export interface ProposalSection {
    status: SectionStatus
    approvedAt?: Timestamp
}

export interface Proposal {
    id: string
    version: number
    status: 'draft' | 'sent' | 'approved' | 'rejected'
    sentAt?: Timestamp
    approvedAt?: Timestamp
    clientSignature?: string
    portalToken?: string
    sections: {
        overview: ProposalSection
        technical: ProposalSection
        budget: ProposalSection
        floorPlan: ProposalSection
    }
    notes: string
}
