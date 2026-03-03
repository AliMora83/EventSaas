import { useEffect, useState } from 'react'
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc,
    doc, serverTimestamp
} from 'firebase/firestore'
import { useMutation } from '@tanstack/react-query'
import { db } from '@/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { EquipmentItem, Booking } from '@/types/equipment'
import { useAppStore } from '@/store/useAppStore'

export function useEquipment() {
    const { orgId } = useAuthStore()
    const addToast = useAppStore((s) => s.addToast)
    const [items, setItems] = useState<EquipmentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!orgId) return
        const q = query(
            collection(db, 'organisations', orgId, 'equipment'),
            orderBy('name', 'asc')
        )
        const unsub = onSnapshot(q, (snap) => {
            setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EquipmentItem)))
            setLoading(false)
        }, (err) => { setError(err.message); setLoading(false) })
        return unsub
    }, [orgId])

    const addItem = useMutation({
        mutationFn: async (data: Omit<EquipmentItem, 'id' | 'createdAt'>) => {
            if (!orgId) throw new Error('No org')
            await addDoc(collection(db, 'organisations', orgId, 'equipment'), {
                ...data, createdAt: serverTimestamp()
            })
        },
        onSuccess: () => addToast({ type: 'success', message: 'Equipment added' }),
        onError: () => addToast({ type: 'error', message: 'Failed to add equipment' }),
    })

    const updateItem = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<EquipmentItem> }) => {
            if (!orgId) throw new Error('No org')
            await updateDoc(doc(db, 'organisations', orgId, 'equipment', id), data)
        },
        onSuccess: () => addToast({ type: 'success', message: 'Equipment updated' }),
        onError: () => addToast({ type: 'error', message: 'Failed to update' }),
    })

    return { items, loading, error, addItem, updateItem }
}

export function useEquipmentBookings(itemId: string) {
    const { orgId } = useAuthStore()
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!orgId || !itemId) return
        const q = query(
            collection(db, 'organisations', orgId, 'equipment', itemId, 'bookings'),
            orderBy('startDate', 'asc')
        )
        const unsub = onSnapshot(q, (snap) => {
            setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)))
            setLoading(false)
        })
        return unsub
    }, [orgId, itemId])

    return { bookings, loading }
}
