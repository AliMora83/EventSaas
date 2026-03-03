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

// Skeleton row helper
function SkeletonRow({ cols }: { cols: number }) {
    return (
        <tr>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="skeleton h-4 w-full rounded" />
                </td>
            ))}
        </tr>
    )
}

export function Dashboard() {
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
            (a.date?.seconds || 0) - (b.date?.seconds || 0)
        ).slice(0, 6),
        [events]
    )

    return (
        <div className="space-y-5">
            {/* Alert banners */}
            {overBudgetEvents.length > 0 && (
                <div className="space-y-2">
                    {overBudgetEvents.map((e) => (
                        <AlertBanner
                            key={e.id}
                            variant="red"
                            message={`Budget overrun: ${e.name} is currently over budget — review your cost lines.`}
                        />
                    ))}
                </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    label="Active Events"
                    value={eventsLoading ? '—' : activeEvents.length}
                    change={activeEvents.length > 0 ? `${activeEvents.length} in production` : 'No active events'}
                    changeDirection="neutral"
                    icon={<CalendarDays size={18} />}
                    loading={eventsLoading}
                />
                <StatCard
                    label="Total Budget"
                    value={budgetLoading ? '—' : zar(totalBudget)}
                    change="Across all active events"
                    changeDirection="neutral"
                    icon={<DollarSign size={18} />}
                    loading={budgetLoading}
                />
                <StatCard
                    label="Equipment Items"
                    value={equipLoading ? '—' : items.length}
                    change={`${items.filter((i) => i.condition === 'repair').length} in repair`}
                    changeDirection={items.filter((i) => i.condition === 'repair').length > 0 ? 'down' : 'neutral'}
                    icon={<Package size={18} />}
                    loading={equipLoading}
                />
                <StatCard
                    label="Crew Roster"
                    value={crewLoading ? '—' : crew.length}
                    change="Available for scheduling"
                    changeDirection="neutral"
                    icon={<Users size={18} />}
                    loading={crewLoading}
                />
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-5 gap-4">
                {/* Upcoming Events — 3 cols */}
                <Card className="col-span-3">
                    <CardHeader
                        title="Upcoming Events"
                        action={
                            <Link to="/budget" className="text-[12px] text-brand font-semibold flex items-center gap-1 hover:underline">
                                View all <ArrowRight size={12} />
                            </Link>
                        }
                    />
                    <div className="divide-y divide-border">
                        {eventsLoading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="px-[18px] py-4 flex items-center gap-3">
                                    <div className="skeleton h-9 w-9 rounded-sm" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="skeleton h-4 w-40" />
                                        <div className="skeleton h-3 w-24" />
                                    </div>
                                </div>
                            ))
                            : upcomingEvents.length === 0
                                ? (
                                    <div className="px-[18px] py-12 text-center">
                                        <CalendarDays size={28} className="text-ink4 mx-auto mb-2" />
                                        <p className="text-ink3 text-[13px]">No events yet</p>
                                        <Link to="/budget">
                                            <Button variant="secondary" size="sm" className="mt-3">Create first event</Button>
                                        </Link>
                                    </div>
                                )
                                : upcomingEvents.map((event) => (
                                    <div key={event.id} className="px-[18px] py-4 flex items-center gap-3 hover:bg-surface2 transition-colors">
                                        {/* Date chip */}
                                        <div className="w-10 text-center flex-shrink-0">
                                            <div className="text-[10px] font-bold text-brand uppercase">
                                                {event.date ? format(new Date(event.date.seconds * 1000), 'MMM') : '—'}
                                            </div>
                                            <div className="font-serif text-[22px] font-semibold text-ink leading-none">
                                                {event.date ? format(new Date(event.date.seconds * 1000), 'd') : '—'}
                                            </div>
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-[13px] text-ink truncate">{event.name}</div>
                                            <div className="text-[12px] text-ink3 truncate">{event.clientName} · {event.venue}</div>
                                        </div>
                                        {/* Badges */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Badge variant={statusBadge[event.status]}>{event.status}</Badge>
                                            <Badge variant={budgetBadge[event.budgetStatus]}>{event.budgetStatus}</Badge>
                                        </div>
                                    </div>
                                ))
                        }
                    </div>
                </Card>

                {/* Budget Overview — 2 cols */}
                <Card className="col-span-2">
                    <CardHeader title="Budget Overview" />
                    <CardBody>
                        {eventsLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="space-y-1.5">
                                        <div className="skeleton h-3 w-32" />
                                        <div className="skeleton h-2 w-full rounded-full" />
                                    </div>
                                ))}
                            </div>
                        ) : activeEvents.length === 0 ? (
                            <div className="py-8 text-center">
                                <DollarSign size={24} className="text-ink4 mx-auto mb-2" />
                                <p className="text-ink3 text-[13px]">No active budgets</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activeEvents.slice(0, 4).map((event) => {
                                    const totals = eventTotals[event.id] ?? { budgeted: 0, actual: 0 }
                                    return (
                                        <div key={event.id}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[12px] font-medium text-ink truncate max-w-[140px]">{event.name}</span>
                                                <Badge variant={budgetBadge[event.budgetStatus]} className="text-[9px]">
                                                    {event.budgetStatus}
                                                </Badge>
                                            </div>
                                            <BudgetBar budgeted={totals.budgeted} actual={totals.actual} />
                                            <div className="flex justify-between mt-0.5">
                                                <span className="text-[10px] text-ink4">{zar(totals.actual)} actual</span>
                                                <span className="text-[10px] text-ink3">{zar(totals.budgeted)} budgeted</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
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
                            <Link to="/timeline" className="text-[12px] text-brand font-semibold flex items-center gap-1 hover:underline">
                                View all <ArrowRight size={12} />
                            </Link>
                        }
                    />
                    <div className="divide-y divide-border">
                        {[
                            { title: 'Confirm stage dimensions with venue', event: 'Sunbird Festival', priority: 'urgent', due: 'Today' },
                            { title: 'Submit permit application', event: 'Sunbird Festival', priority: 'high', due: 'Tomorrow' },
                            { title: 'Finalise AV equipment list', event: 'Cape Town Jazz', priority: 'medium', due: 'Mar 8' },
                            { title: 'Send crew call times', event: 'Soweto Unplugged', priority: 'low', due: 'Mar 12' },
                        ].map((task, i) => (
                            <div key={i} className="px-[18px] py-3 flex items-center gap-3 hover:bg-surface2 transition-colors">
                                <Clock size={14} className="text-ink4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-medium text-ink truncate">{task.title}</div>
                                    <div className="text-[11px] text-ink4">{task.event}</div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Badge variant={task.priority === 'urgent' ? 'red' : task.priority === 'high' ? 'orange' : task.priority === 'medium' ? 'amber' : 'neutral'}>
                                        {task.priority}
                                    </Badge>
                                    <span className="text-[11px] text-ink4">{task.due}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Crew Roster */}
                <Card>
                    <CardHeader
                        title="Crew Roster"
                        action={
                            <Link to="/timeline" className="text-[12px] text-brand font-semibold flex items-center gap-1 hover:underline">
                                Schedule <ArrowRight size={12} />
                            </Link>
                        }
                    />
                    <div className="divide-y divide-border">
                        {crewLoading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="px-[18px] py-3 flex items-center gap-3">
                                    <div className="skeleton w-8 h-8 rounded-full" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="skeleton h-3 w-28" />
                                        <div className="skeleton h-3 w-20" />
                                    </div>
                                </div>
                            ))
                            : crew.length === 0
                                ? (
                                    <div className="px-[18px] py-10 text-center">
                                        <Users size={24} className="text-ink4 mx-auto mb-2" />
                                        <p className="text-ink3 text-[13px]">No crew members yet</p>
                                    </div>
                                )
                                : crew.slice(0, 5).map((member) => (
                                    <div key={member.id} className="px-[18px] py-3 flex items-center gap-3 hover:bg-surface2 transition-colors">
                                        <Avatar initials={member.avatarInitials} color={member.avatarColor} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-medium text-ink">{member.name}</div>
                                            <div className="text-[11px] text-ink4">{member.role}</div>
                                        </div>
                                        <span className="text-[12px] text-ink3 flex-shrink-0">
                                            R {member.dayRate?.toLocaleString()}/day
                                        </span>
                                    </div>
                                ))
                        }
                    </div>
                </Card>
            </div>
        </div>
    )
}
