import React from 'react'
import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard, DollarSign, Package, CalendarDays,
    FileText, Layers, Settings, Zap, ShieldCheck, LogOut
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { auth } from '@/firebase'
import { signOut } from 'firebase/auth'

type NavSection = {
    title: string
    items: {
        to: string
        label: string
        icon: any
        badge?: { count: number; color: 'red' | 'green' | 'amber' }
    }[]
}

const navSections: NavSection[] = [
    {
        title: 'Main',
        items: [
            { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ]
    },
    {
        title: 'Production',
        items: [
            { to: '/budget', label: 'Cost & Budget', icon: DollarSign, badge: { count: 2, color: 'amber' } },
            { to: '/stock', label: 'Stock & Equipment', icon: Package },
            { to: '/timeline', label: 'Timeline & Crew', icon: CalendarDays, badge: { count: 1, color: 'red' } },
        ]
    },
    {
        title: 'Client',
        items: [
            { to: '/proposals', label: 'Presentations', icon: FileText, badge: { count: 3, color: 'green' } },
            { to: '/visual', label: '2D / 3D Visual', icon: Layers },
        ]
    }
]

const badgeClasses = {
    red: 'bg-red-light text-red',
    green: 'bg-green-light text-green',
    amber: 'bg-amber-light text-amber',
}

export function Sidebar() {
    const { user, role } = useAuthStore()

    return (
        <aside
            className="w-[220px] flex-shrink-0 h-screen bg-surface border-r border-border flex flex-col z-10"
            style={{ position: 'fixed', left: 0, top: 0, bottom: 0 }}
        >
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                <div className="w-[30px] h-[30px] bg-brand rounded-[8px] flex items-center justify-center font-serif font-extrabold text-[14px] text-white">
                    E
                </div>
                <div>
                    <div className="font-sans text-[13px] font-bold text-ink hover:cursor-pointer transition">
                        Event<span className="text-brand">SaaS</span>
                    </div>
                    <div className="text-[9px] text-ink4 tracking-[0.04em]">eventsaas.namka.cloud</div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-1 px-2 overflow-y-auto">
                {navSections.map((section) => (
                    <div key={section.title} className="mb-2">
                        <div className="px-2.5 pt-3.5 pb-1.5 text-[9px] font-bold text-ink4 uppercase tracking-[0.1em]">
                            {section.title}
                        </div>
                        <ul className="space-y-0.5">
                            {section.items.map(({ to, label, icon: Icon, badge }) => (
                                <li key={to}>
                                    <NavLink
                                        to={to}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2.5 px-2.5 py-2 mx-2 rounded-sm text-[12.5px] font-medium transition-all relative
                                            ${isActive
                                                ? 'bg-brand-light text-brand font-semibold'
                                                : 'text-ink2 hover:bg-bg hover:text-ink'
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {isActive && (
                                                    <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-brand rounded-r-[3px]" />
                                                )}
                                                <Icon size={16} className="flex-shrink-0" />
                                                <span className="flex-1">{label}</span>
                                                {badge && (
                                                    <span className={`text-[9px] font-bold px-1.5 py-[1px] rounded-[10px] ${badgeClasses[badge.color]}`}>
                                                        {badge.count}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                <div className="px-2.5 pt-3.5 pb-1.5 text-[9px] font-bold text-ink4 uppercase tracking-[0.1em] mt-2">
                    Settings
                </div>
                <ul className="space-y-0.5">
                    {role === 'admin' && (
                        <li>
                            <NavLink
                                to="/admin"
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 px-2.5 py-2 mx-2 rounded-sm text-[12.5px] font-medium transition-all relative
                                    ${isActive
                                        ? 'bg-red-light text-red font-semibold'
                                        : 'text-ink2 hover:bg-bg hover:text-ink'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-red rounded-r-[3px]" />
                                        )}
                                        <ShieldCheck size={16} className="flex-shrink-0" />
                                        <span className="flex-1">Admin Panel</span>
                                    </>
                                )}
                            </NavLink>
                        </li>
                    )}
                    <li>
                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `flex items-center gap-2.5 px-2.5 py-2 mx-2 rounded-sm text-[12.5px] font-medium transition-all relative
                                ${isActive
                                    ? 'bg-brand-light text-brand font-semibold'
                                    : 'text-ink2 hover:bg-bg hover:text-ink'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-brand rounded-r-[3px]" />
                                    )}
                                    <Settings size={16} className="flex-shrink-0" />
                                    <span className="flex-1">Settings</span>
                                </>
                            )}
                        </NavLink>
                    </li>
                </ul>
            </nav>

            {/* User footer */}
            <div className="mt-auto p-3 border-t border-border flex items-center justify-between group">
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-sm w-full">
                    <Avatar initials={user?.displayName?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || 'AD'} size="sm" />
                    <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold text-ink truncate">
                            {user?.displayName || 'Loading...'}
                        </div>
                        <div className="text-[10px] text-ink4 capitalize truncate">
                            {role || '—'}
                        </div>
                    </div>
                    <button
                        onClick={() => signOut(auth)}
                        className="p-1.5 text-ink4 hover:text-red hover:bg-red-light rounded-sm opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Log out"
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </aside>
    )
}
