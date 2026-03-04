import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function Login() {
    const { user, isLoading } = useAuthStore()
    const [mode, setMode] = useState<'signin' | 'register'>('signin')

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

    if (!isLoading && user) return <Navigate to="/dashboard" replace />

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (mode === 'register' && password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }

        setLoading(true)
        try {
            if (mode === 'signin') {
                await signInWithEmailAndPassword(auth, email, password)
            } else {
                const result = await createUserWithEmailAndPassword(auth, email, password)
                await updateProfile(result.user, { displayName: name })

                // Create user doc
                const orgId = import.meta.env.VITE_ORG_ID || 'namka-events'
                const ref = doc(db, 'organisations', orgId, 'users', result.user.uid)
                await setDoc(ref, {
                    uid: result.user.uid,
                    displayName: name,
                    email: result.user.email,
                    role: 'viewer',
                    createdAt: serverTimestamp(),
                    lastSignIn: serverTimestamp(),
                })
            }
        } catch (err: any) {
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError('Invalid email or password')
            } else if (err.code === 'auth/email-already-in-use') {
                setError('An account with that email already exists.')
            } else {
                setError(mode === 'signin' ? 'Sign in failed. Please try again.' : 'Registration failed. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setError(null)
        setGoogleLoading(true)
        try {
            const result = await signInWithPopup(auth, new GoogleAuthProvider())

            // Ensure user doc
            const orgId = import.meta.env.VITE_ORG_ID || 'namka-events'
            const ref = doc(db, 'organisations', orgId, 'users', result.user.uid)
            const snap = await getDoc(ref)
            if (!snap.exists()) {
                await setDoc(ref, {
                    uid: result.user.uid,
                    displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Unknown',
                    email: result.user.email,
                    role: 'viewer',
                    createdAt: serverTimestamp(),
                    lastSignIn: serverTimestamp(),
                })
            } else {
                await setDoc(ref, { lastSignIn: serverTimestamp() }, { merge: true })
            }
        } catch (err: any) {
            setError('Google sign in failed. Please try again.')
        } finally {
            setGoogleLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: 'radial-gradient(circle, #1c1917 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
            />

            <div className="relative w-full max-w-sm">
                {/* Logo */}
                <div className="flex flex-col items-center mb-[22px]">
                    <div className="w-[44px] h-[44px] rounded-[12px] bg-brand flex items-center justify-center font-serif font-bold text-white text-[20px] mb-[14px]">
                        E
                    </div>
                    <div className="font-sans text-[18px] font-bold text-ink mb-1">
                        Event<span className="text-brand">SaaS</span>
                    </div>
                    <div className="text-[11px] text-ink4">eventsaas.namka.cloud · Production Management</div>
                </div>

                {/* Card */}
                <div className="bg-surface border border-border rounded-[14px] shadow-[0_8px_32px_rgba(28,25,23,0.1)] p-7">

                    {/* Tabs */}
                    <div className="flex border border-border rounded-md overflow-hidden mb-[22px]">
                        <button
                            type="button"
                            className={`flex-1 py-2 text-[12px] font-semibold transition-colors ${mode === 'signin' ? 'bg-brand text-white' : 'bg-bg text-ink3 hover:text-ink2'}`}
                            onClick={() => { setMode('signin'); setError(null) }}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-2 text-[12px] font-semibold transition-colors ${mode === 'register' ? 'bg-brand text-white' : 'bg-bg text-ink3 hover:text-ink2'}`}
                            onClick={() => { setMode('register'); setError(null) }}
                        >
                            Register
                        </button>
                    </div>

                    {error && (
                        <div className="mb-[14px] p-[9px] px-3 bg-red-light border border-[#fca5a5] rounded-md text-[#991b1b] text-[12px]">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-[14px]">
                        {mode === 'register' && (
                            <Input
                                id="name"
                                label="Full Name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Jan van Zyl"
                                required
                            />
                        )}
                        <Input
                            id="email"
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.co.za"
                            required
                            autoComplete="email"
                        />
                        <Input
                            id="password"
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={mode === 'register' ? "Min. 8 characters" : "••••••••"}
                            required
                            autoComplete={mode === 'register' ? "new-password" : "current-password"}
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={loading}
                            className="w-full justify-center mt-3"
                        >
                            {mode === 'signin' ? 'Sign In' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[11px] text-ink4">or</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        loading={googleLoading}
                        className="w-full justify-center bg-surface hover:bg-bg border border-border text-ink"
                        onClick={handleGoogleLogin}
                    >
                        <svg width="16" height="16" viewBox="0 0 48 48" className="mr-2">
                            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z" />
                            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.6 26.9 36 24 36c-5.2 0-9.6-3.2-11.3-7.8l-6.6 4.8C9.8 39.7 16.4 44 24 44z" />
                            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C41 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-4z" />
                        </svg>
                        Continue with Google
                    </Button>

                    <div className="text-center text-[11px] text-ink4 mt-5">
                        By {mode === 'signin' ? 'signing in' : 'registering'} you agree to the <a href="#" className="flex-1 text-brand font-semibold hover:underline">Terms of Service</a>.<br />
                        EventSaaS · Powered by <a href="https://mywork.namka.cloud" target="_blank" className="text-brand font-semibold hover:underline"> Namka</a>
                    </div>
                </div>
            </div>
        </div>
    )
}
