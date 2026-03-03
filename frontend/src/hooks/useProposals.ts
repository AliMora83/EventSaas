import { useEffect, useState } from 'react'
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc,
    doc, serverTimestamp
} from 'firebase/firestore'
import { useMutation } from '@tanstack/react-query'
import { db } from '@/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { Proposal } from '@/types/proposal'
import { useAppStore } from '@/store/useAppStore'

export function useProposals(eventId?: string) {
    const { orgId } = useAuthStore()
    const addToast = useAppStore((s) => s.addToast)
    const [proposals, setProposals] = useState<Proposal[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!orgId || !eventId) { setLoading(false); return }
        const q = query(
            collection(db, 'organisations', orgId, 'events', eventId, 'proposal'),
            orderBy('version', 'desc')
        )
        const unsub = onSnapshot(q, (snap) => {
            setProposals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Proposal)))
            setLoading(false)
        })
        return unsub
    }, [orgId, eventId])

    const createProposal = useMutation({
        mutationFn: async (data: Omit<Proposal, 'id'>) => {
            if (!orgId || !eventId) throw new Error('No org/event')
            await addDoc(
                collection(db, 'organisations', orgId, 'events', eventId, 'proposal'),
                { ...data, createdAt: serverTimestamp() }
            )
        },
        onSuccess: () => addToast({ type: 'success', message: 'Proposal created' }),
        onError: () => addToast({ type: 'error', message: 'Failed to create proposal' }),
    })

    const updateProposal = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Proposal> }) => {
            if (!orgId || !eventId) throw new Error('No org/event')
            await updateDoc(
                doc(db, 'organisations', orgId, 'events', eventId, 'proposal', id),
                data
            )
        },
        onSuccess: () => addToast({ type: 'success', message: 'Proposal updated' }),
        onError: () => addToast({ type: 'error', message: 'Failed to update proposal' }),
    })

    return { proposals, loading, createProposal, updateProposal }
}
