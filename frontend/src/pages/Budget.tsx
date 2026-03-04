import React, { useState, useMemo } from 'react'
import {
    Plus, DollarSign, TrendingUp, TrendingDown,
    FileText, CheckCircle, ChevronRight, ChevronLeft,
    AlertTriangle, Package
} from 'lucide-react'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { BudgetBar, ProgressBar } from '@/components/ui/ProgressBar'
import { Tabs } from '@/components/ui/Tabs'
import { useEvents } from '@/hooks/useEvents'
import { useBudget } from '@/hooks/useBudget'
import { useBudgetSummary } from '@/hooks/useBudgetSummary'
import { useAuthStore } from '@/store/useAuthStore'
import { BudgetLine, BudgetCategory, BudgetLineStatus } from '@/types/budget'
import { AppEvent } from '@/types/event'
import { AIBudgetEstimator } from '@/components/budget/AIBudgetEstimator'
import { BudgetTableRow } from '@/components/budget/BudgetTableRow'

// ── Formatters ────────────────────────────────────────────────
const zar = (n: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n)

const CATEGORIES: BudgetCategory[] = [
    'staging', 'av', 'lighting', 'labour', 'transport', 'catering', 'permits', 'decor', 'other',
]

const STATUS_COLOR: Record<BudgetLineStatus, any> = {
    estimate: 'neutral',
    quoted: 'blue',
    approved: 'green',
    invoiced: 'amber',
    paid: 'neutral',
}

const CAT_ICONS: Record<string, string> = {
    staging: '🏗', av: '🔊', lighting: '💡', labour: '👷',
    transport: '🚛', catering: '🍽', permits: '📋', decor: '🎨', other: '📦',
}

// ── Add Line Modal ─────────────────────────────────────────────
function AddLineModal({ eventId, eventName, onClose }: { eventId: string; eventName: string; onClose: () => void }) {
    const { addLine } = useBudget(eventId)
    const [form, setForm] = useState({
        category: 'av' as BudgetCategory,
        description: '',
        supplier: '',
        budgeted: '',
        actual: '',
        vatRate: '15',
        quoteRef: '',
        status: 'estimate' as BudgetLineStatus,
        notes: '',
    })
    const [submitting, setSubmitting] = useState(false)

    const budgeted = parseFloat(form.budgeted) || 0
    const actual = parseFloat(form.actual) || 0
    const vatRate = (parseFloat(form.vatRate) || 15) / 100
    const vatAmt = budgeted * vatRate

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        addLine.mutate({
            eventId,
            eventName,
            category: form.category,
            description: form.description,
            supplier: form.supplier,
            budgeted,
            actual,
            vatRate: parseFloat(form.vatRate) || 15,
            quoteRef: form.quoteRef,
            status: form.status,
            attachmentUrl: '',
            notes: form.notes,
        })
        onClose()
    }

    return (
        <form id="add-line-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Select label="Category" value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as BudgetCategory })}>
                    {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                </Select>
                <Select label="Status" value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as BudgetLineStatus })}>
                    <option value="estimate">Estimate</option>
                    <option value="quoted">Quoted</option>
                    <option value="approved">Approved</option>
                    <option value="invoiced">Invoiced</option>
                    <option value="paid">Paid</option>
                </Select>
            </div>
            <Input label="Description" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. FOH sound system package" required />
            <Input label="Supplier" value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="e.g. SoundCo SA" />
            <div className="grid grid-cols-2 gap-4">
                <Input label="Budgeted (ZAR excl VAT)" type="number" value={form.budgeted}
                    onChange={(e) => setForm({ ...form, budgeted: e.target.value })}
                    placeholder="0.00" required />
                <Input label="Actual (ZAR excl VAT)" type="number" value={form.actual}
                    onChange={(e) => setForm({ ...form, actual: e.target.value })}
                    placeholder="0.00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Quote Reference" value={form.quoteRef}
                    onChange={(e) => setForm({ ...form, quoteRef: e.target.value })}
                    placeholder="QT-2026-001" />
                <Input label="VAT Rate (%)" type="number" value={form.vatRate}
                    onChange={(e) => setForm({ ...form, vatRate: e.target.value })}
                    placeholder="15" />
            </div>
            <Textarea label="Notes" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes…" rows={2} />

            {budgeted > 0 && (
                <div className="bg-surface2 border border-border rounded p-3 text-[12px] space-y-1">
                    <div className="flex justify-between text-ink3"><span>Subtotal (excl VAT)</span><span>{zar(budgeted)}</span></div>
                    <div className="flex justify-between text-ink3"><span>VAT @ {form.vatRate || 15}%</span><span>{zar(vatAmt)}</span></div>
                    <div className="flex justify-between font-bold text-ink border-t border-border pt-1 mt-1">
                        <span>Total (incl VAT)</span><span>{zar(budgeted + vatAmt)}</span>
                    </div>
                </div>
            )}
        </form>
    )
}

// ── Event Summary Card (top-level list view) ──────────────────
function EventCard({
    event, budgeted, actual, onClick,
}: { event: AppEvent; budgeted: number; actual: number; onClick: () => void }) {
    const overBudget = actual > budgeted && actual > 0
    const variance = actual - budgeted

    return (
        <button
            onClick={onClick}
            className="w-full text-left group bg-surface border border-border rounded hover:border-brand hover:shadow-sm transition-all p-5 flex flex-col gap-3"
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="text-[14px] font-bold text-ink group-hover:text-brand transition-colors">
                        {event.name}
                    </div>
                    <div className="text-[12px] text-ink3 mt-0.5">
                        {event.clientName} · {event.venue}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {overBudget && (
                        <Badge variant="red">
                            <AlertTriangle size={10} className="mr-0.5 inline" />
                            Over-budget
                        </Badge>
                    )}
                    {!overBudget && actual > 0 && <Badge variant="green">On-track</Badge>}
                    {actual === 0 && <Badge variant="amber">Estimate</Badge>}
                    <ChevronRight size={14} className="text-ink4 group-hover:text-brand transition-colors" />
                </div>
            </div>

            {/* Budget bar */}
            <div>
                <BudgetBar budgeted={budgeted} actual={actual} />
                <div className="flex justify-between mt-1 text-[11px]">
                    <span className="text-ink4">
                        Actual: <span className={overBudget ? 'text-red font-semibold' : 'text-ink3'}>{zar(actual)}</span>
                    </span>
                    <span className="text-ink4">Budget: {zar(budgeted)}</span>
                </div>
            </div>

            {/* Variance pill */}
            {actual > 0 && (
                <div className={`text-[11px] flex items-center gap-1 font-semibold ${overBudget ? 'text-red' : 'text-green'}`}>
                    {overBudget
                        ? <><TrendingUp size={12} /> {zar(Math.abs(variance))} over budget</>
                        : <><TrendingDown size={12} /> {zar(Math.abs(variance))} under budget</>
                    }
                </div>
            )}
        </button>
    )
}

// ── Drill-down: single event budget ───────────────────────────
function EventBudgetDetail({
    event, onBack, onAddLine,
}: { event: AppEvent; onBack: () => void; onAddLine: () => void }) {
    const { lines, loading, totals, updateLine, deleteLine } = useBudget(event.id)
    const { role } = useAuthStore()
    const isAdmin = role === 'admin'
    const [editingLineId, setEditingLineId] = useState<string | null>(null)

    const grouped = useMemo(() => {
        const map: Record<string, BudgetLine[]> = {}
        lines.forEach((l) => {
            if (!map[l.category]) map[l.category] = []
            map[l.category].push(l)
        })
        return map
    }, [lines])

    const totalBudgeted = totals.budgeted
    const totalActual = totals.actual
    const vatAmount = totalBudgeted * 0.15
    const overBudget = totalActual > totalBudgeted && totalActual > 0

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-[13px] text-ink3 hover:text-brand transition-colors cursor-pointer"
                >
                    <ChevronLeft size={14} /> All Events
                </button>
                {isAdmin && (
                    <Button size="sm" variant="primary" icon={<Plus size={13} />} onClick={onAddLine}>
                        Add Line
                    </Button>
                )}
            </div>

            <AIBudgetEstimator eventId={event.id} eventName={event.name} />

            {/* Event header card */}
            <div className={`rounded border p-4 ${overBudget ? 'bg-red/5 border-red/30' : 'bg-surface border-border'}`}>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-[16px] font-bold text-ink">{event.name}</div>
                        <div className="text-[12px] text-ink3">{event.clientName} · {event.venue}</div>
                    </div>
                    {overBudget && (
                        <Badge variant="red">
                            <AlertTriangle size={10} className="mr-1 inline" />
                            Over-budget by {zar(totalActual - totalBudgeted)}
                        </Badge>
                    )}
                    {!overBudget && totalActual > 0 && <Badge variant="green">On-track</Badge>}
                    {totalActual === 0 && <Badge variant="amber">Estimates only</Badge>}
                </div>
                <div className="mt-3">
                    <BudgetBar budgeted={totalBudgeted} actual={totalActual} />
                    <div className="flex justify-between mt-1 text-[11px] text-ink4">
                        <span>Actual: {zar(totalActual)}</span>
                        <span>Budget: {zar(totalBudgeted)}</span>
                    </div>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-3 gap-4">
                {/* Line items — 2 cols */}
                <div className="col-span-2">
                    <Card>
                        {loading ? (
                            <CardBody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="py-3 space-y-1.5">
                                        <div className="skeleton h-3 w-40" />
                                        <div className="skeleton h-3 w-full rounded" />
                                    </div>
                                ))}
                            </CardBody>
                        ) : Object.keys(grouped).length === 0 ? (
                            <CardBody>
                                <div className="py-12 text-center">
                                    <DollarSign size={28} className="text-ink4 mx-auto mb-2" />
                                    <p className="text-ink3 text-[13px] mb-3">No budget lines yet</p>
                                    <Button size="sm" icon={<Plus size={13} />} onClick={onAddLine}>Add first line</Button>
                                </div>
                            </CardBody>
                        ) : (
                            <div>
                                {/* Column headers */}
                                <div className="px-[18px] py-2 grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border">
                                    <span className="text-[10px] font-bold text-ink4 uppercase tracking-wider">Item / Supplier</span>
                                    <span className="text-[10px] font-bold text-ink4 uppercase tracking-wider text-right w-24">Budget</span>
                                    <span className="text-[10px] font-bold text-ink4 uppercase tracking-wider text-right w-24">Actual</span>
                                    <span className="text-[10px] font-bold text-ink4 uppercase tracking-wider w-24 text-right pr-6">Status</span>
                                </div>

                                {Object.entries(grouped).map(([cat, catLines]) => {
                                    const catBudgeted = catLines.reduce((s, l) => s + l.budgeted, 0)
                                    const catActual = catLines.reduce((s, l) => s + l.actual, 0)
                                    const catOver = catActual > catBudgeted && catActual > 0
                                    return (
                                        <div key={cat}>
                                            {/* Category header row */}
                                            <div className={`px-[18px] py-2 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center ${catOver ? 'bg-red/5' : 'bg-surface2'} border-b border-border`}>
                                                <span className="text-[11px] font-bold text-ink3 uppercase tracking-wider">
                                                    {CAT_ICONS[cat]} {cat}
                                                    {catOver && <span className="ml-2 text-red">↑ overrun</span>}
                                                </span>
                                                <span className="text-[11px] font-semibold text-ink3 text-right w-24">{zar(catBudgeted)}</span>
                                                <span className={`text-[11px] font-bold text-right w-24 ${catOver ? 'text-red' : 'text-ink3'}`}>{zar(catActual)}</span>
                                                <span className="w-24" />
                                            </div>

                                            {/* Line items */}
                                            {catLines.map((line) => (
                                                <BudgetTableRow
                                                    key={line.id}
                                                    line={line}
                                                    isAdmin={isAdmin}
                                                    isEditing={editingLineId === line.id}
                                                    onEdit={() => setEditingLineId(line.id)}
                                                    onCancel={() => setEditingLineId(null)}
                                                    onSave={(updatedData, oldData) => {
                                                        updateLine.mutate({ id: line.id, data: updatedData, oldData })
                                                        setEditingLineId(null)
                                                    }}
                                                    onDelete={(id, oldData) => {
                                                        deleteLine.mutate({ id, oldData })
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )
                                })}

                                {/* Totals footer */}
                                {totalBudgeted > 0 && (
                                    <CardFooter>
                                        <div className="text-[12px] space-y-1.5 w-full max-w-xs ml-auto">
                                            <div className="flex justify-between text-ink3">
                                                <span>Subtotal (excl VAT)</span>
                                                <span className="font-semibold">{zar(totalBudgeted)}</span>
                                            </div>
                                            <div className="flex justify-between text-ink3">
                                                <span>VAT @ 15%</span>
                                                <span>{zar(vatAmount)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-ink border-t border-border pt-1.5 mt-1">
                                                <span>TOTAL (incl VAT)</span>
                                                <span className={overBudget ? 'text-red' : ''}>{zar(totalBudgeted + vatAmount)}</span>
                                            </div>
                                            {totalActual > 0 && (
                                                <div className="flex justify-between text-ink3 pt-1 border-t border-border mt-1">
                                                    <span>Actual incl VAT</span>
                                                    <span className={`font-semibold ${overBudget ? 'text-red' : 'text-green'}`}>
                                                        {zar(totalActual * 1.15)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </CardFooter>
                                )}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Category breakdown sidebar — 1 col */}
                <div className="space-y-3">
                    <Card>
                        <CardHeader title="By Category" />
                        <CardBody>
                            {Object.keys(grouped).length === 0 ? (
                                <div className="py-4 text-center text-ink4 text-[12px]">No data</div>
                            ) : (
                                <div className="space-y-4">
                                    {Object.entries(grouped).map(([cat, catLines]) => {
                                        const b = catLines.reduce((s, l) => s + l.budgeted, 0)
                                        const a = catLines.reduce((s, l) => s + l.actual, 0)
                                        return (
                                            <div key={cat}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-[12px] font-semibold text-ink capitalize">
                                                        {CAT_ICONS[cat]} {cat}
                                                    </span>
                                                    <span className={`text-[11px] font-semibold ${a > b && a > 0 ? 'text-red' : 'text-ink4'}`}>
                                                        {a > 0 ? zar(a) : zar(b)}
                                                    </span>
                                                </div>
                                                <BudgetBar budgeted={b} actual={a} />
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Quick stats */}
                    <Card>
                        <CardBody>
                            <div className="space-y-3 text-[12px]">
                                <div className="flex justify-between">
                                    <span className="text-ink3">Line items</span>
                                    <span className="font-semibold text-ink">{lines.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-ink3">Approved</span>
                                    <span className="font-semibold text-green">
                                        {lines.filter(l => l.status === 'approved').length}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-ink3">Invoiced / Paid</span>
                                    <span className="font-semibold text-amber">
                                        {lines.filter(l => l.status === 'invoiced' || l.status === 'paid').length}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-ink3">Estimates</span>
                                    <span className="font-semibold text-ink4">
                                        {lines.filter(l => l.status === 'estimate').length}
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    )
}

// ── Main Budget page ───────────────────────────────────────────
export function Budget() {
    const { events, loading: eventsLoading } = useEvents()
    const { eventTotals, loading: summaryLoading } = useBudgetSummary(events)

    const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
    const [addModal, setAddModal] = useState(false)

    const selectedEvent = events.find(e => e.id === selectedEventId)

    const allLoading = eventsLoading || summaryLoading

    // ── Drill-down view ─────────────────────────────────────
    if (selectedEvent) {
        return (
            <>
                <EventBudgetDetail
                    event={selectedEvent}
                    onBack={() => setSelectedEventId(null)}
                    onAddLine={() => setAddModal(true)}
                />
                <Modal
                    open={addModal}
                    onClose={() => setAddModal(false)}
                    title={`Add Budget Line — ${selectedEvent.name}`}
                    size="md"
                    footer={
                        <>
                            <Button variant="secondary" size="sm" onClick={() => setAddModal(false)}>Cancel</Button>
                            <Button variant="primary" size="sm" type="submit" form="add-line-form">Add Line Item</Button>
                        </>
                    }
                >
                    <AddLineModal
                        eventId={selectedEvent.id}
                        eventName={selectedEvent.name}
                        onClose={() => setAddModal(false)}
                    />
                </Modal>
            </>
        )
    }

    // ── All-events summary view ──────────────────────────────
    const totalPortfolioBudget = Object.values(eventTotals).reduce((s, t) => s + t.budgeted, 0)
    const totalPortfolioActual = Object.values(eventTotals).reduce((s, t) => s + t.actual, 0)

    return (
        <div className="space-y-5">
            {/* Portfolio header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[13px] text-ink3">All Events · Budget Overview</div>
                    {!allLoading && (
                        <div className="text-[22px] font-serif font-semibold text-ink mt-0.5">
                            {zar(totalPortfolioBudget)}
                            <span className="text-[13px] font-sans font-normal text-ink3 ml-2">total portfolio budget</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!allLoading && (
                        <div className="text-right">
                            <div className="text-[12px] text-ink3">Actual spend</div>
                            <div className={`text-[16px] font-bold ${totalPortfolioActual > totalPortfolioBudget ? 'text-red' : 'text-green'}`}>
                                {zar(totalPortfolioActual)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Event cards */}
            {allLoading ? (
                <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-surface border border-border rounded p-5 space-y-3">
                            <div className="skeleton h-4 w-40" />
                            <div className="skeleton h-3 w-24" />
                            <div className="skeleton h-2 w-full rounded-full" />
                        </div>
                    ))}
                </div>
            ) : events.length === 0 ? (
                <div className="py-20 text-center">
                    <DollarSign size={32} className="text-ink4 mx-auto mb-3" />
                    <p className="text-ink3 text-[14px]">No events yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {events.map((event) => {
                        const t = eventTotals[event.id] ?? { budgeted: 0, actual: 0 }
                        return (
                            <EventCard
                                key={event.id}
                                event={event}
                                budgeted={t.budgeted}
                                actual={t.actual}
                                onClick={() => setSelectedEventId(event.id)}
                            />
                        )
                    })}
                </div>
            )}

            {/* Portfolio summary bar */}
            {!allLoading && events.length > 0 && (
                <Card>
                    <CardHeader title="Portfolio Spend vs Budget" />
                    <CardBody>
                        <div className="space-y-4">
                            {events.map((event) => {
                                const t = eventTotals[event.id] ?? { budgeted: 0, actual: 0 }
                                return (
                                    <div key={event.id}>
                                        <div className="flex items-center justify-between mb-1">
                                            <button
                                                onClick={() => setSelectedEventId(event.id)}
                                                className="text-[13px] font-semibold text-ink hover:text-brand transition-colors cursor-pointer"
                                            >
                                                {event.name}
                                            </button>
                                            <div className="flex items-center gap-2 text-[11px] text-ink4">
                                                <span>{zar(t.actual)} spent</span>
                                                <span className="text-ink5">/ {zar(t.budgeted)} budget</span>
                                            </div>
                                        </div>
                                        <BudgetBar budgeted={t.budgeted} actual={t.actual} />
                                    </div>
                                )
                            })}
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    )
}
