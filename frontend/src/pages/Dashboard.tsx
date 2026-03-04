import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
    CalendarDays, DollarSign, Package, Users,
    ArrowRight, Clock, AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AlertBanner } from '@/components/ui/Alert'
import { BudgetBar } from '@/components/ui/ProgressBar'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useEvents } from '@/hooks/useEvents'
import { useEquipment } from '@/hooks/useEquipment'
import { useCrew } from '@/hooks/useCrew'
import { useBudgetSummary } from '@/hooks/useBudgetSummary'
import { AppEvent } from '@/types/event'
import { useAuthStore } from '@/store/useAuthStore'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// ZAR formatter
const zar = (n: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n)

const statusBadge: Record<AppEvent['status'], any> = {
    planning: 'blue',
    active: 'green',
    live: 'brand',
    complete: 'neutral',
    cancelled: 'red',
}

const budgetBadge: Record<AppEvent['budgetStatus'], any> = {
    'on-track': 'green',
    'over-budget': 'red',
    'pending': 'amber',
}

const getEventDate = (date: any): Date | null => {
    if (!date) return null
    if (typeof date.toDate === 'function') return date.toDate()
    if (typeof date.seconds === 'number') return new Date(date.seconds * 1000)
    const parsed = new Date(date)
    return isNaN(parsed.getTime()) ? null : parsed
}

function DashboardContent() {
    const { user } = useAuthStore()
    const { events, loading: eventsLoading } = useEvents()
    const { items, loading: equipLoading } = useEquipment()
    const { crew, loading: crewLoading } = useCrew()
    const { eventTotals, totalBudget, loading: budgetLoading } = useBudgetSummary(events)

    const activeEvents = useMemo(
        () => events.filter((e) => e.status === 'active' || e.status === 'planning'),
        [events]
    )

    const overBudgetEvents = useMemo(
        () => activeEvents.filter((e) => e.budgetStatus === 'over-budget'),
        [activeEvents]
    )

    const deployedItems = useMemo(
        () => items.filter((i) => i.condition !== 'repair'),
        [items]
    )

    const upcomingEvents = useMemo(
        () => [...events].sort((a, b) =>
            (getEventDate(a.date)?.getTime() || 0) - (getEventDate(b.date)?.getTime() || 0)
        ).slice(0, 6),
        [events]
    )

    // Dynamic greeting
    const hr = new Date().getHours()
    const greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening"
    const firstName = user?.displayName?.split(" ")[0] || "there"

    return (
        <div className="space-y-5 pb-8">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="font-serif text-[24px] font-semibold text-ink mb-1">
                    {greet}, {firstName} 👋
                </h1>
                <p className="text-[12px] text-ink3">
                    {eventsLoading ? 'Loading events…' : `You have ${activeEvents.length} active events · check alerts below`}
                </p>
            </div>

            {/* Alert banners */}
            {overBudgetEvents.length > 0 && (
                <div className="space-y-2">
                    {overBudgetEvents.map((e) => (
                        <AlertBanner
                            key={e.id}
                            variant="amber"
                            icon={<span className="text-[14px]">📦</span>}
                            message={<><strong>Budget overrun:</strong> {e.name} is currently over budget.</>}
                        />
                    ))}
                </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    label="Active Events"
                    value={eventsLoading ? '—' : activeEvents.length.toString()}
                    change={activeEvents.length > 0 ? `+${activeEvents.length} this month` : 'Loading'}
                    changeDirection="neutral"
                    icon={<span className="text-[20px]">📅</span>}
                    loading={eventsLoading}
                />
                <StatCard
                    label="Total Budget (ZAR)"
                    value={budgetLoading ? '—' : zar(totalBudget)}
                    change="-2.1% vs last month"
                    changeDirection="down"
                    icon={<span className="text-[20px]">💰</span>}
                    loading={budgetLoading}
                />
                <StatCard
                    label="Equipment Deployed"
                    value={equipLoading ? '—' : deployedItems.length.toString()}
                    change="↑ utilisation"
                    changeDirection="up"
                    icon={<span className="text-[20px]">📦</span>}
                    loading={equipLoading}
                />
                <StatCard
                    label="Crew Scheduled"
                    value={crewLoading ? '—' : crew.length.toString()}
                    change="Across events"
                    changeDirection="neutral"
                    icon={<span className="text-[20px]">👥</span>}
                    loading={crewLoading}
                />
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Upcoming Events */}
                <Card>
                    <CardHeader
                        title="Upcoming Events"
                        action={
                            <Link to="/budget" className="text-[11px] text-brand font-semibold hover:underline cursor-pointer">
                                View all →
                            </Link>
                        }
                    />
                    <div className="p-[18px] flex flex-col gap-2.5">
                        {eventsLoading ? (
                            <div className="text-ink4 text-[12px]">Loading events…</div>
                        ) : upcomingEvents.length === 0 ? (
                            <div className="text-ink4 text-[12px]">No events yet</div>
                        ) : (
                            upcomingEvents.map((event) => (
                                <div key={event.id} className="bg-surface border border-border rounded-[10px] p-4 flex items-start gap-3.5 transition-all hover:shadow-[0_4px_12px_rgba(28,25,23,.08),0_1px_3px_rgba(28,25,23,.04)] hover:border-border2 cursor-pointer">
                                    {/* Date chip */}
                                    <div className="bg-brand-light border border-[#fed7aa] rounded-lg py-2 px-3 text-center flex-shrink-0 min-w-[52px]">
                                        <div className="font-serif text-[22px] font-semibold text-brand leading-none">
                                            {getEventDate(event.date) ? format(getEventDate(event.date)!, 'd') : '—'}
                                        </div>
                                        <div className="text-[9px] font-bold text-amber uppercase tracking-[0.1em] mt-1">
                                            {getEventDate(event.date) ? format(getEventDate(event.date)!, 'MMM') : ''}
                                        </div>
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-[13px] text-ink mb-[3px] truncate">{event.name}</div>
                                        <div className="text-[11px] text-ink3 mb-1.5 truncate">📍 {event.venue || '—'}</div>
                                        <div className="flex flex-wrap gap-[5px]">
                                            <Badge variant={budgetBadge[event.budgetStatus]}>
                                                {event.budgetStatus === 'over-budget' ? 'Over budget' : event.budgetStatus === 'on-track' ? 'On track' : 'Pending sign-off'}
                                            </Badge>
                                            {event.expectedPax && (
                                                <Badge variant="blue">{event.expectedPax.toLocaleString()} pax</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Budget Overview */}
                <Card>
                    <CardHeader
                        title="Budget Overview — March"
                        action={
                            <span className="text-[11px] text-brand font-semibold hover:underline cursor-pointer">
                                Full report →
                            </span>
                        }
                    />
                    <CardBody>
                        <div className="flex flex-col gap-2.5">
                            {eventsLoading ? (
                                <div className="text-ink4 text-[12px]">Loading…</div>
                            ) : activeEvents.length === 0 ? (
                                <div className="text-ink4 text-[12px]">No active budgets</div>
                            ) : (
                                activeEvents.slice(0, 4).map((event) => {
                                    const totals = eventTotals[event.id] ?? { budgeted: 0, actual: 0 }
                                    const percent = totals.budgeted > 0 ? Math.min((totals.actual / totals.budgeted) * 100, 100) : 0
                                    const widthMap: Record<string, string> = { "over-budget": "100%", "on-track": "72%", "pending": "55%" }
                                    const colorMap: Record<string, string> = { "over-budget": "bg-red", "on-track": "bg-green", "pending": "bg-amber" }

                                    return (
                                        <div key={event.id} className="flex items-center gap-2.5">
                                            <div className="text-[11.5px] font-medium text-ink2 w-[130px] flex-shrink-0 truncate">
                                                {event.name?.split(" ").slice(0, 2).join(" ")}
                                            </div>
                                            <div className="flex-1 bg-bg2 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full ${colorMap[event.budgetStatus] || 'bg-blue'}`}
                                                    style={{ width: widthMap[event.budgetStatus] || `${percent}%` }}
                                                />
                                            </div>
                                            <div className="text-[11px] font-semibold text-ink w-[80px] text-right flex-shrink-0">
                                                —
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <div className="mt-5">
                            <div className="text-[11px] text-ink4 mb-2">Monthly revenue — last 6 months</div>
                            <div className="flex items-end gap-[3px] h-[40px]">
                                <div className="flex-1 rounded-t-[3px] bg-brand-light transition-colors hover:bg-brand" style={{ height: '55%' }} />
                                <div className="flex-1 rounded-t-[3px] bg-brand-light transition-colors hover:bg-brand" style={{ height: '70%' }} />
                                <div className="flex-1 rounded-t-[3px] bg-brand-light transition-colors hover:bg-brand" style={{ height: '48%' }} />
                                <div className="flex-1 rounded-t-[3px] bg-brand-light transition-colors hover:bg-brand" style={{ height: '88%' }} />
                                <div className="flex-1 rounded-t-[3px] bg-brand-light transition-colors hover:bg-brand" style={{ height: '65%' }} />
                                <div className="flex-1 rounded-t-[3px] bg-brand transition-colors" style={{ height: '100%' }} />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-2 gap-4">
                {/* Pending Tasks */}
                <Card>
                    <CardHeader
                        title="Pending Tasks"
                        action={
                            <span className="text-[11px] text-brand font-semibold hover:underline cursor-pointer">
                                View all
                            </span>
                        }
                    />
                    <CardBody className="p-0">
                        <table className="w-full border-collapse">
                            <tbody>
                                {[
                                    { badgeClass: 'bg-red-light text-red', badgeText: 'Urgent', title: 'Review Sunbird rigging quote', due: 'Today' },
                                    { badgeClass: 'bg-amber-light text-amber', badgeText: 'Action', title: 'Resolve Par64 conflict', due: '5 Mar' },
                                    { badgeClass: 'bg-blue-light text-blue', badgeText: 'Send', title: 'Cape Town Jazz proposal v2', due: '6 Mar' },
                                    { badgeClass: 'bg-bg2 text-ink3', badgeText: 'Review', title: 'Soweto floor plan — client feedback', due: '8 Mar' },
                                    { badgeClass: 'bg-green-light text-green', badgeText: 'Done', title: 'Confirm crew for Sunbird load-in', due: '2 Mar' },
                                ].map((task, i) => (
                                    <tr key={i} className="hover:bg-bg group">
                                        <td className="py-[11px] px-[14px] border-b border-border group-last:border-none w-1">
                                            <span className={`inline-flex items-center gap-1 py-[2px] px-2 rounded-[20px] text-[10px] font-semibold tracking-[0.02em] whitespace-nowrap ${task.badgeClass}`}>
                                                {task.badgeText}
                                            </span>
                                        </td>
                                        <td className="py-[11px] px-[14px] border-b border-border group-last:border-none text-[12px] text-ink2 align-middle">
                                            {task.title}
                                        </td>
                                        <td className="py-[11px] px-[14px] border-b border-border group-last:border-none text-[11px] text-ink4 align-middle text-right whitespace-nowrap">
                                            {task.due}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>

                {/* Crew Roster */}
                <Card>
                    <CardHeader
                        title="Crew Allocation"
                        action={
                            <span className="text-[11px] text-brand font-semibold hover:underline cursor-pointer">
                                Full schedule
                            </span>
                        }
                    />
                    <CardBody>
                        <div className="flex flex-col">
                            {crewLoading
                                ? <div className="text-ink4 text-[12px]">Loading crew…</div>
                                : crew.length === 0
                                    ? <div className="text-ink4 text-[12px]">No crew available</div>
                                    : crew.slice(0, 5).map((member, i) => {
                                        const initials = member.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
                                        const colors = ["linear-gradient(135deg,#c2410c,#ea580c)", "linear-gradient(135deg,#0369a1,#0ea5e9)", "linear-gradient(135deg,#4f46e5,#7c3aed)", "linear-gradient(135deg,#059669,#10b981)", "linear-gradient(135deg,#b45309,#d97706)"]
                                        const bg = colors[i % colors.length]

                                        return (
                                            <div key={member.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-none">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                                                    style={{ background: bg }}
                                                >
                                                    {initials}
                                                </div>
                                                <div>
                                                    <div className="text-[12.5px] font-semibold text-ink">{member.name}</div>
                                                    <div className="text-[11px] text-ink4">{member.role}</div>
                                                </div>
                                            </div>
                                        )
                                    })
                            }
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    )
}

export function Dashboard() {
    return (
        <ErrorBoundary componentName="Dashboard">
            <DashboardContent />
        </ErrorBoundary>
    )
}
