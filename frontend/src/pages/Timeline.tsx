import React, { useState } from 'react'
import { CalendarDays, Plus, Users, Flag } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useEvents } from '@/hooks/useEvents'
import { useTasks, useCrew } from '@/hooks/useCrew'
import { useAppStore } from '@/store/useAppStore'
import { AppTask, TaskPhase, Priority } from '@/types/crew'

const phaseColors: Record<TaskPhase, string> = {
    design: '#dc2626',
    permits: '#2563eb',
    delivery: '#78716c',
    loadIn: '#c2410c',
    rehearsal: '#d97706',
    showDay: '#059669',
    loadOut: '#78716c',
}

const priorityColor: Record<Priority, any> = {
    low: 'neutral', medium: 'amber', high: 'orange', urgent: 'red',
}

const taskStatusColor: Record<string, any> = {
    pending: 'amber', 'in-progress': 'blue', done: 'green', blocked: 'red',
}

function GanttChart({ tasks }: { tasks: AppTask[] }) {
    if (tasks.length === 0) {
        return (
            <div className="py-12 text-center">
                <CalendarDays size={28} className="text-ink4 mx-auto mb-2" />
                <p className="text-ink3 text-[13px]">No tasks yet — add tasks to see the Gantt chart</p>
            </div>
        )
    }

    const allDates = tasks.flatMap((t) => [t.startDate?.seconds || 0, t.endDate?.seconds || 0])
    const minDate = Math.min(...allDates)
    const maxDate = Math.max(...allDates)
    const totalMs = (maxDate - minDate) * 1000 || 1

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[600px]">
                {tasks.map((task) => {
                    const start = (task.startDate?.seconds || minDate) - minDate
                    const duration = (task.endDate?.seconds || task.startDate?.seconds || minDate) - (task.startDate?.seconds || minDate)
                    const leftPct = (start / (maxDate - minDate || 1)) * 100
                    const widthPct = Math.max((duration / (maxDate - minDate || 1)) * 100, 2)
                    const color = phaseColors[task.phase] || '#78716c'

                    return (
                        <div key={task.id} className="flex items-center gap-3 mb-2">
                            <div className="w-40 flex-shrink-0 text-[12px] font-medium text-ink truncate" title={task.title}>{task.title}</div>
                            <div className="flex-1 relative h-7 bg-bg2 rounded-sm">
                                <div
                                    className="absolute top-1 h-5 rounded-sm flex items-center px-2"
                                    style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: color + '33', border: `1.5px solid ${color}` }}
                                >
                                    <span className="text-[10px] font-semibold truncate" style={{ color }}>
                                        {task.phase}
                                    </span>
                                </div>
                            </div>
                            <Badge variant={taskStatusColor[task.status]} className="flex-shrink-0">{task.status}</Badge>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export function Timeline() {
    const [tab, setTab] = useState('gantt')
    const { events } = useEvents()
    const { selectedEventId, setSelectedEvent } = useAppStore()
    const eventId = selectedEventId || events[0]?.id || ''
    const { tasks, loading: tasksLoading } = useTasks(eventId)
    const { crew, loading: crewLoading } = useCrew()

    const tabs = [
        { key: 'gantt', label: 'Production Gantt' },
        { key: 'crew', label: 'Crew Schedule' },
        { key: 'milestones', label: 'Milestones' },
        { key: 'board', label: 'Task Board' },
    ]

    // Kanban columns
    const boardCols = ['pending', 'in-progress', 'done', 'blocked'] as const

    return (
        <div className="space-y-4">
            {/* Event selector */}
            {events.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    {events.map((e) => (
                        <button key={e.id} onClick={() => setSelectedEvent(e.id)}
                            className={`px-3 py-1.5 rounded-sm text-[12px] font-semibold border transition-all cursor-pointer ${e.id === eventId ? 'bg-brand text-white border-brand' : 'bg-surface text-ink2 border-border hover:border-brand hover:text-brand'
                                }`}
                        >
                            {e.name}
                        </button>
                    ))}
                </div>
            )}

            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {tab === 'gantt' && (
                <Card>
                    <CardHeader title="Production Gantt" action={<Button size="sm" icon={<Plus size={13} />}>Add Task</Button>} />
                    <CardBody>
                        {tasksLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-7 w-full rounded-sm" />)}
                            </div>
                        ) : (
                            <GanttChart tasks={tasks} />
                        )}
                    </CardBody>
                </Card>
            )}

            {tab === 'crew' && (
                <Card>
                    <CardHeader title="Crew Schedule" action={<Button size="sm" icon={<Plus size={13} />}>Assign Crew</Button>} />
                    <div className="divide-y divide-border">
                        {crewLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="px-[18px] py-4 flex items-center gap-3">
                                    <div className="skeleton w-8 h-8 rounded-full" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="skeleton h-3 w-32" />
                                        <div className="skeleton h-3 w-20" />
                                    </div>
                                </div>
                            ))
                        ) : crew.length === 0 ? (
                            <div className="px-[18px] py-10 text-center">
                                <Users size={24} className="text-ink4 mx-auto mb-2" />
                                <p className="text-ink3 text-[13px]">No crew members — add crew in Settings</p>
                            </div>
                        ) : (
                            crew.map((member) => (
                                <div key={member.id} className="px-[18px] py-4 flex items-center gap-3 hover:bg-surface2 transition-colors">
                                    <Avatar initials={member.avatarInitials} color={member.avatarColor} size="sm" />
                                    <div className="flex-1">
                                        <div className="text-[13px] font-semibold text-ink">{member.name}</div>
                                        <div className="text-[11px] text-ink4">{member.role}</div>
                                    </div>
                                    <span className="text-[12px] text-ink3">R {member.dayRate?.toLocaleString()}/day</span>
                                    <Badge variant="neutral">Available</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            )}

            {tab === 'milestones' && (
                <Card>
                    <CardHeader title="Key Milestones" action={<Button size="sm" icon={<Plus size={13} />}>Add Milestone</Button>} />
                    <CardBody>
                        <div className="space-y-3">
                            {[
                                { label: 'Technical Rider Approved', date: 'Mar 7', done: true },
                                { label: 'Permits Submitted', date: 'Mar 8', done: true },
                                { label: 'Equipment Delivery', date: 'Mar 12', done: false },
                                { label: 'Load-In Day', date: 'Mar 13', done: false },
                                { label: 'Show Day', date: 'Mar 14', done: false },
                            ].map((m, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${m.done ? 'bg-green border-green' : 'border-border2'}`}>
                                        {m.done && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <div className="flex-1">
                                        <span className={`text-[13px] ${m.done ? 'text-ink3 line-through' : 'text-ink font-medium'}`}>{m.label}</span>
                                    </div>
                                    <span className="text-[12px] text-ink4">{m.date}</span>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}

            {tab === 'board' && (
                <div className="grid grid-cols-4 gap-4">
                    {boardCols.map((col) => {
                        const colTasks = tasks.filter((t) => t.status === col)
                        return (
                            <div key={col} className="bg-bg2 rounded-[10px] p-3">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-bold text-ink3 uppercase tracking-wider capitalize">{col.replace('-', ' ')}</span>
                                    <Badge variant={taskStatusColor[col]}>{colTasks.length}</Badge>
                                </div>
                                <div className="space-y-2">
                                    {colTasks.map((task) => (
                                        <div key={task.id} className="bg-surface border border-border rounded-sm p-3 shadow-sm">
                                            <div className="text-[12px] font-medium text-ink mb-2">{task.title}</div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={priorityColor[task.priority]} className="text-[9px]">{task.priority}</Badge>
                                                <span className="text-[10px] text-ink4 capitalize">{task.phase}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {colTasks.length === 0 && (
                                        <div className="py-4 text-center text-[11px] text-ink4 border border-dashed border-border2 rounded-sm">
                                            No tasks
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
