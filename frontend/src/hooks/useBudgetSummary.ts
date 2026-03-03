import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { AppEvent } from '@/types/event'

export interface EventBudgetTotals {
    budgeted: number
    actual: number
}

/**
 * Subscribes to every event's budgetLines subcollection and returns:
 *   - eventTotals: { [eventId]: { budgeted, actual } }
 *   - totalBudget: sum of all events' budgeted amounts
 *   - totalActual: sum of all events' actual amounts
 *   - loading: true until all listeners have resolved
 */
export function useBudgetSummary(events: AppEvent[]) {
    const { orgId } = useAuthStore()
    const [eventTotals, setEventTotals] = useState<Record<string, EventBudgetTotals>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!orgId || events.length === 0) {
            setLoading(false)
            return
        }

        // Track per-event data in a local ref so snapshot callbacks don't stale-close
        const localTotals: Record<string, EventBudgetTotals> = {}
        let resolved = 0

        const unsubs = events.map((event) => {
            const ref = collection(
                db,
                'organisations', orgId,
                'events', event.id,
                'budgetLines'
            )
            return onSnapshot(ref, (snap) => {
                let budgeted = 0
                let actual = 0
                snap.docs.forEach((d) => {
                    const data = d.data()
                    budgeted += Number(data.budgeted) || 0
                    actual += Number(data.actual) || 0
                })
                localTotals[event.id] = { budgeted, actual }
                resolved++

                // Update state once all listeners have fired at least once
                setEventTotals({ ...localTotals })
                if (resolved >= events.length) setLoading(false)
            })
        })

        return () => unsubs.forEach((u) => u())
    }, [orgId, events]) // re-subscribe when event list changes

    const totalBudget = Object.values(eventTotals).reduce((s, t) => s + t.budgeted, 0)
    const totalActual = Object.values(eventTotals).reduce((s, t) => s + t.actual, 0)

    return { eventTotals, totalBudget, totalActual, loading }
}
