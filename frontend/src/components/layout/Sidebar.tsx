import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, DollarSign, Package, CalendarDays,
    FileText, Layers, Settings, Zap, ShieldCheck
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/budget', label: 'Budget Hub', icon: DollarSign },
    { to: '/stock', label: 'Inventory', icon: Package },
    { to: '/timeline', label: 'Timeline', icon: CalendarDays },
    { to: '/proposals', label: 'Proposals', icon: FileText },
    { to: '/visual', label: 'Visual', icon: Layers },
]

export function Sidebar() {
    const { user, role } = useAuthStore()
    const location = useLocation()

    return (
        <aside
            className="w-[220px] flex-shrink-0 h-screen bg-surface border-r border-border flex flex-col"
            style={{ position: 'fixed', left: 0, top: 0, bottom: 0 }}
        >
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                <div className="w-7 h-7 bg-brand rounded-sm flex items-center justify-center">
                    <Zap size={15} className="text-white" />
                </div>
                <div>
                    <div className="font-serif text-[15px] font-semibold italic text-ink">EventSaaS</div>
                    <div className="text-[10px] text-ink4 uppercase tracking-wider">Namka Events</div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto">
                <div className="text-[9.5px] font-bold text-ink4 uppercase tracking-widest px-2 mb-2">
                    Production
                </div>
                <ul className="space-y-0.5">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <li key={to}>
                            <NavLink
                                to={to}
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 px-3 py-2 rounded-sm text-[13px] font-medium transition-all
                  ${isActive
                                        ? 'bg-brand-light text-brand border-l-[3px] border-brand pl-[9px]'
                                        : 'text-ink2 hover:bg-bg2 hover:text-ink border-l-[3px] border-transparent pl-[9px]'
                                    }`
                                }
                            >
                                <Icon size={15} className="flex-shrink-0" />
                                {label}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className="text-[9.5px] font-bold text-ink4 uppercase tracking-widest px-2 mt-6 mb-2">
                    Admin
                </div>
                <ul className="space-y-0.5">
                    {role === 'admin' && (
                        <li>
                            <NavLink
                                to="/admin"
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 px-3 py-2 rounded-sm text-[13px] font-medium transition-all
                    ${isActive
                                        ? 'bg-red-50 text-red-700 border-l-[3px] border-red-600 pl-[9px]'
                                        : 'text-ink2 hover:bg-bg2 hover:text-ink border-l-[3px] border-transparent pl-[9px]'
                                    }`
                                }
                            >
                                <ShieldCheck size={15} className="flex-shrink-0" />
                                Admin Panel
                            </NavLink>
                        </li>
                    )}
                    <li>
                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `flex items-center gap-2.5 px-3 py-2 rounded-sm text-[13px] font-medium transition-all
                ${isActive
                                    ? 'bg-brand-light text-brand border-l-[3px] border-brand pl-[9px]'
                                    : 'text-ink2 hover:bg-bg2 hover:text-ink border-l-[3px] border-transparent pl-[9px]'
                                }`
                            }
                        >
                            <Settings size={15} className="flex-shrink-0" />
                            Settings
                        </NavLink>
                    </li>
                </ul>
            </nav>

            {/* User footer */}
            <div className="border-t border-border px-4 py-3 flex items-center gap-2.5">
                <Avatar initials={user?.displayName?.slice(0, 2).toUpperCase() || 'AD'} size="sm" />
                <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-ink truncate">
                        {user?.displayName || 'Admin'}
                    </div>
                    <div className="text-[10px] text-ink4 capitalize">{role || 'admin'}</div>
                </div>
            </div>
        </aside>
    )
}
