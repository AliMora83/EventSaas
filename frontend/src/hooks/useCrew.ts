import { useEffect, useState } from 'react'
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc,
    doc, serverTimestamp
} from 'firebase/firestore'
import { useMutation } from '@tanstack/react-query'
import { db } from '@/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { CrewMember, CrewAssignment, AppTask } from '@/types/crew'
import { useAppStore } from '@/store/useAppStore'

export function useCrew() {
    const { orgId } = useAuthStore()
    const addToast = useAppStore((s) => s.addToast)
    const [crew, setCrew] = useState<CrewMember[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!orgId) return
        const q = query(collection(db, 'organisations', orgId, 'crew'), orderBy('name', 'asc'))
        const unsub = onSnapshot(q, (snap) => {
            setCrew(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CrewMember)))
            setLoading(false)
        })
        return unsub
    }, [orgId])

    const addCrew = useMutation({
        mutationFn: async (data: Omit<CrewMember, 'id'>) => {
            if (!orgId) throw new Error('No org')
            await addDoc(collection(db, 'organisations', orgId, 'crew'), data)
        },
        onSuccess: () => addToast({ type: 'success', message: 'Crew member added' }),
        onError: () => addToast({ type: 'error', message: 'Failed to add crew member' }),
    })

    return { crew, loading, addCrew }
}

export function useCrewAssignments(eventId: string) {
    const { orgId } = useAuthStore()
    const [assignments, setAssignments] = useState<CrewAssignment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!orgId || !eventId) return
        const q = query(
            collection(db, 'organisations', orgId, 'events', eventId, 'crewAssignments'),
            orderBy('startDate', 'asc')
        )
        const unsub = onSnapshot(q, (snap) => {
            setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CrewAssignment)))
            setLoading(false)
        })
        return unsub
    }, [orgId, eventId])

    return { assignments, loading }
}

export function useTasks(eventId?: string) {
    const { orgId } = useAuthStore()
    const addToast = useAppStore((s) => s.addToast)
    const [tasks, setTasks] = useState<AppTask[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!orgId || !eventId) { setLoading(false); return }
        const q = query(
            collection(db, 'organisations', orgId, 'events', eventId, 'tasks'),
            orderBy('startDate', 'asc')
        )
        const unsub = onSnapshot(q, (snap) => {
            setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppTask)))
            setLoading(false)
        })
        return unsub
    }, [orgId, eventId])

    const addTask = useMutation({
        mutationFn: async (data: Omit<AppTask, 'id'>) => {
            if (!orgId || !eventId) throw new Error('No org/event')
            await addDoc(collection(db, 'organisations', orgId, 'events', eventId, 'tasks'), data)
        },
        onSuccess: () => addToast({ type: 'success', message: 'Task created' }),
        onError: () => addToast({ type: 'error', message: 'Failed to create task' }),
    })

    const updateTask = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<AppTask> }) => {
            if (!orgId || !eventId) throw new Error('No org/event')
            await updateDoc(doc(db, 'organisations', orgId, 'events', eventId, 'tasks', id), data)
        },
    })

    return { tasks, loading, addTask, updateTask }
}
