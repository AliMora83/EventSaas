import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastContainer } from '@/components/ui/Alert'
import { useAuthStore } from '@/store/useAuthStore'
import { AIAssistantDrawer } from '@/components/ai/AIAssistantDrawer'

export function AppLayout() {
    const { user, isLoading } = useAuthStore()

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-bg">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    <span className="text-ink3 text-[13px]">Loading EventSaaS…</span>
                </div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return (
        <div className="flex h-screen bg-bg overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col" style={{ marginLeft: 220 }}>
                <Topbar />
                <main
                    className="flex-1 overflow-y-auto p-6"
                    style={{ marginTop: 56 }}
                >
                    <Outlet />
                </main>
            </div>
            <AIAssistantDrawer />
            <ToastContainer />
        </div>
    )
}
