import React from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'

const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/budget': 'Cost & Budget Hub',
    '/stock': 'Stock & Equipment',
    '/timeline': 'Timeline & Crew',
    '/proposals': 'Client Proposals',
    '/visual': 'Visual Engine',
    '/settings': 'Settings',
}

export function Topbar() {
    const location = useLocation()
    const { user } = useAuthStore()
    const title = pageTitles[location.pathname] || 'EventSaaS'

    return (
        <header
            className="h-[56px] bg-surface border-b border-border flex items-center px-6 gap-4"
            style={{ position: 'fixed', top: 0, left: 220, right: 0, zIndex: 10 }}
        >
            {/* Page title */}
            <h1 className="font-serif text-[20px] font-semibold italic text-ink flex-shrink-0">
                {title}
            </h1>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search */}
            <div className="relative hidden md:flex items-center">
                <Search size={13} className="absolute left-3 text-ink4" />
                <input
                    type="search"
                    placeholder="Search events, equipment…"
                    className="h-8 w-56 pl-8 pr-3 bg-bg border border-border rounded-sm text-[12px] text-ink placeholder:text-ink4 focus:outline-none focus:border-brand transition-all"
                />
            </div>

            {/* Notifications */}
            <button
                className="relative w-8 h-8 flex items-center justify-center text-ink3 hover:text-ink hover:bg-bg2 rounded-sm transition-all cursor-pointer"
                aria-label="Notifications"
            >
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red rounded-full" />
            </button>

            {/* Avatar */}
            <Avatar
                initials={user?.displayName?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || 'AD'}
                size="sm"
                className="cursor-pointer"
            />
        </header>
    )
}
