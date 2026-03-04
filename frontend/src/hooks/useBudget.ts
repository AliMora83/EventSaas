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
import { updateDocById, deleteDocById } from '@/lib/firebaseUtils'
import { getDocs } from 'firebase/firestore'

const syncEventBudgetStats = async (orgId: string, eventId: string) => {
    // TODO: move to Cloud Function
    const q = query(collection(db, 'organisations', orgId, 'events', eventId, 'budgetLines'))
    const snap = await getDocs(q)
    const lines = snap.docs.map(d => d.data() as BudgetLine)
    const totalBudgeted = lines.reduce((s, l) => s + (l.budgeted || 0), 0)
    const totalActual = lines.reduce((s, l) => s + (l.actual || 0), 0)
    const budgetVariance = totalActual - totalBudgeted
    let budgetStatus = 'on-track'
    if (budgetVariance > 0) budgetStatus = 'over-budget'
    else if (totalBudgeted === 0 && totalActual === 0) budgetStatus = 'estimate'

    await updateDoc(doc(db, 'organisations', orgId, 'events', eventId), {
        budgetStatus, totalBudgeted, totalActual, budgetVariance, updatedAt: serverTimestamp()
    })
}

export function useBudget(eventId?: string) {
    const { orgId, user } = useAuthStore()
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
            await syncEventBudgetStats(orgId, eventId)
        },
        onSuccess: () => addToast({ type: 'success', message: 'Budget line added' }),
        onError: () => addToast({ type: 'error', message: 'Failed to add budget line' }),
    })

    const updateLine = useMutation({
        mutationFn: async ({ id, data, oldData }: { id: string; data: Partial<BudgetLine>, oldData: BudgetLine }) => {
            if (!orgId || !eventId || !user) throw new Error('No org/event/user')
            // Don't await here since optimistic UI shouldn't be blocked
            await updateDocById(orgId, eventId, 'budgetLines', id, data, user, oldData)
            await syncEventBudgetStats(orgId, eventId)
        },
        onMutate: async ({ id, data, oldData }) => {
            setLines(prev => prev.map(l => l.id === id ? { ...l, ...data } as BudgetLine : l))
            return { oldData, id }
        },
        onSuccess: () => addToast({ type: 'success', message: 'Budget line updated' }),
        onError: (_err, _variables, context) => {
            if (context) {
                setLines(prev => prev.map(l => l.id === context.id ? context.oldData : l))
            }
            addToast({ type: 'error', message: 'Failed to update line — changes reverted' })
        },
    })

    const deleteLine = useMutation({
        mutationFn: async ({ id, oldData }: { id: string; oldData: BudgetLine }) => {
            if (!orgId || !eventId || !user) throw new Error('No org/event/user')
            await deleteDocById(orgId, eventId, 'budgetLines', id, user, oldData)
            await syncEventBudgetStats(orgId, eventId)
        },
        onMutate: async ({ id, oldData }) => {
            setLines(prev => prev.filter(l => l.id !== id))
            return { oldData, id }
        },
        onSuccess: () => addToast({ type: 'success', message: 'Line removed' }),
        onError: (_err, _variables, context) => {
            if (context) {
                setLines(prev => [...prev, context.oldData].sort((a, b) => a.createdAt > b.createdAt ? 1 : -1))
            }
            addToast({ type: 'error', message: 'Failed to remove line — changes reverted' })
        },
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
