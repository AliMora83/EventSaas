import { create } from 'zustand'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'

export type UserRole = 'admin' | 'editor' | 'viewer'

interface AuthState {
    user: User | null
    orgId: string | null
    role: UserRole | null
    isLoading: boolean
    setUser: (user: User | null) => void
    setOrg: (orgId: string, role: UserRole) => void
    setLoading: (loading: boolean) => void
    reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    orgId: null,
    role: null,
    isLoading: true,
    setUser: (user) => set({ user }),
    setOrg: (orgId, role) => set({ orgId, role }),
    setLoading: (isLoading) => set({ isLoading }),
    reset: () => set({ user: null, orgId: null, role: null, isLoading: false }),
}))

// Bootstrap auth listener — call once at app root
export function initAuthListener() {
    const { setUser, setOrg, setLoading, reset } = useAuthStore.getState()

    return onAuthStateChanged(
        auth,
        async (user) => {
            if (user) {
                setUser(user)
                try {
                    const orgId = import.meta.env.VITE_ORG_ID || 'namka-events'
                    const userDoc = await getDoc(doc(db, 'organisations', orgId, 'users', user.uid))
                    if (userDoc.exists()) {
                        const data = userDoc.data()
                        setOrg(orgId, data.role || 'viewer')
                    } else {
                        setOrg(orgId, 'viewer')
                    }
                } catch (err) {
                    console.error('Failed to fetch user role:', err)
                    setOrg(import.meta.env.VITE_ORG_ID || 'namka-events', 'viewer')
                }
            } else {
                reset()
            }
            setLoading(false)
        },
        (error) => {
            // Firebase not configured — degrade gracefully
            console.warn('[EventSaaS] Auth listener error (check Firebase config):', error.message)
            reset()
        }
    )
}

