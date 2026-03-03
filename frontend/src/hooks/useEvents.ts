import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc,
    doc, serverTimestamp, where, getDocs
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '@/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { AppEvent } from '@/types/event'
import { useAppStore } from '@/store/useAppStore'

export function useEvents() {
    const { orgId } = useAuthStore()
    const addToast = useAppStore((s) => s.addToast)
    const [events, setEvents] = useState<AppEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const qc = useQueryClient()

    useEffect(() => {
        if (!orgId) return
        const q = query(
            collection(db, 'organisations', orgId, 'events'),
            orderBy('date', 'asc')
        )
        const unsub = onSnapshot(q, (snap) => {
            setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppEvent)))
            setLoading(false)
        }, (err) => {
            setError(err.message)
            setLoading(false)
        })
        return unsub
    }, [orgId])

    const createEvent = useMutation({
        mutationFn: async (data: Omit<AppEvent, 'id' | 'createdAt'>) => {
            if (!orgId) throw new Error('No org')
            await addDoc(collection(db, 'organisations', orgId, 'events'), {
                ...data,
                createdAt: serverTimestamp(),
            })
        },
        onSuccess: () => {
            addToast({ type: 'success', message: 'Event created successfully' })
            qc.invalidateQueries({ queryKey: ['events', orgId] })
        },
        onError: () => addToast({ type: 'error', message: 'Failed to create event' }),
    })

    const updateEvent = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<AppEvent> }) => {
            if (!orgId) throw new Error('No org')
            await updateDoc(doc(db, 'organisations', orgId, 'events', id), data)
        },
        onSuccess: () => addToast({ type: 'success', message: 'Event updated' }),
        onError: () => addToast({ type: 'error', message: 'Failed to update event' }),
    })

    return { events, loading, error, createEvent, updateEvent }
}

export function useActiveEvents() {
    const { events, loading, error } = useEvents()
    return {
        events: events.filter((e) => e.status === 'active' || e.status === 'planning'),
        loading,
        error,
    }
}
