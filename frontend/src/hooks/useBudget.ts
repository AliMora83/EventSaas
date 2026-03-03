import { useEffect, useState } from 'react'
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc,
    doc, serverTimestamp
} from 'firebase/firestore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { BudgetLine } from '@/types/budget'
import { useAppStore } from '@/store/useAppStore'

export function useBudget(eventId?: string) {
    const { orgId } = useAuthStore()
    const addToast = useAppStore((s) => s.addToast)
    const [lines, setLines] = useState<BudgetLine[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const qc = useQueryClient()

    useEffect(() => {
        if (!orgId || !eventId) { setLoading(false); return }
        const q = query(
            collection(db, 'organisations', orgId, 'events', eventId, 'budgetLines'),
            orderBy('createdAt', 'asc')
        )
        const unsub = onSnapshot(q, (snap) => {
            setLines(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BudgetLine)))
            setLoading(false)
        }, (err) => { setError(err.message); setLoading(false) })
        return unsub
    }, [orgId, eventId])

    const addLine = useMutation({
        mutationFn: async (data: Omit<BudgetLine, 'id' | 'createdAt' | 'updatedAt'>) => {
            if (!orgId || !eventId) throw new Error('No org/event')
            await addDoc(
                collection(db, 'organisations', orgId, 'events', eventId, 'budgetLines'),
                { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
            )
        },
        onSuccess: () => addToast({ type: 'success', message: 'Budget line added' }),
        onError: () => addToast({ type: 'error', message: 'Failed to add budget line' }),
    })

    const updateLine = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<BudgetLine> }) => {
            if (!orgId || !eventId) throw new Error('No org/event')
            await updateDoc(
                doc(db, 'organisations', orgId, 'events', eventId, 'budgetLines', id),
                { ...data, updatedAt: serverTimestamp() }
            )
        },
        onSuccess: () => addToast({ type: 'success', message: 'Budget line updated' }),
        onError: () => addToast({ type: 'error', message: 'Failed to update line' }),
    })

    const deleteLine = useMutation({
        mutationFn: async (id: string) => {
            if (!orgId || !eventId) throw new Error('No org/event')
            await deleteDoc(doc(db, 'organisations', orgId, 'events', eventId, 'budgetLines', id))
        },
        onSuccess: () => addToast({ type: 'success', message: 'Line removed' }),
        onError: () => addToast({ type: 'error', message: 'Failed to remove line' }),
    })

    const totals = {
        budgeted: lines.reduce((s, l) => s + l.budgeted, 0),
        actual: lines.reduce((s, l) => s + l.actual, 0),
        vatAmount: lines.reduce((s, l) => s + l.budgeted * (l.vatRate || 0.15), 0),
    }

    return { lines, loading, error, addLine, updateLine, deleteLine, totals }
}

export function useAllBudgetLines() {
    const { orgId } = useAuthStore()
    const [allLines, setAllLines] = useState<BudgetLine[]>([])
    const [loading, setLoading] = useState(true)

    // For cross-event budget views — we aggregate per event
    // This is simplified; real impl would use collection group queries
    useEffect(() => {
        setLoading(false)
    }, [orgId])

    return { allLines, loading }
}
