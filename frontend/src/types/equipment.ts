import { Timestamp } from 'firebase/firestore'

export type EquipmentCategory =
    | 'lighting' | 'audio' | 'staging' | 'rigging' | 'video'
    | 'power' | 'communication' | 'other'

export type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'repair'

export type EquipmentStatus = 'available' | 'deployed' | 'in-repair' | 'conflict'

export type BookingStatus = 'reserved' | 'checked-out' | 'returned'

export interface EquipmentItem {
    id: string
    name: string
    category: EquipmentCategory
    subcategory: string
    quantity: number
    unit: string
    purchaseValue: number
    condition: EquipmentCondition
    serialNumbers: string[]
    icon: string
    notes: string
    createdAt: Timestamp
}

export interface Booking {
    id: string
    eventId: string
    eventName: string
    quantityBooked: number
    startDate: Timestamp
    endDate: Timestamp
    status: BookingStatus
    checkedOutBy: string
    checkedOutAt?: Timestamp
    returnedAt?: Timestamp
}
