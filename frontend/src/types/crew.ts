import { Timestamp } from 'firebase/firestore'

export type TaskPhase =
    | 'design' | 'permits' | 'delivery' | 'loadIn' | 'rehearsal' | 'showDay' | 'loadOut'

export type TaskStatus = 'pending' | 'in-progress' | 'done' | 'blocked'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface AppTask {
    id: string
    eventId: string
    eventName?: string
    title: string
    phase: TaskPhase
    startDate: Timestamp
    endDate: Timestamp
    assignedTo: string[]
    status: TaskStatus
    priority: Priority
    notes: string
}

export interface CrewMember {
    id: string
    name: string
    role: string
    dayRate: number
    phone: string
    email: string
    skills: string[]
    avatarInitials: string
    avatarColor: string
}

export interface CrewAssignment {
    id: string
    crewId: string
    crewName: string
    role: string
    startDate: Timestamp
    endDate: Timestamp
    dayRate: number
    notes: string
    eventId?: string
    eventName?: string
}
