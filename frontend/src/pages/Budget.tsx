import React, { useState, useMemo } from 'react'
import { Plus, DollarSign, TrendingUp, FileText, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { ProgressBar, BudgetBar } from '@/components/ui/ProgressBar'
import { useEvents } from '@/hooks/useEvents'
import { useBudget } from '@/hooks/useBudget'
import { useAppStore } from '@/store/useAppStore'
import { BudgetLine, BudgetCategory, BudgetLineStatus } from '@/types/budget'
import { Timestamp, serverTimestamp } from 'firebase/firestore'

const zar = (n: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n)

const categories: BudgetCategory[] = ['staging', 'av', 'lighting', 'labour', 'transport', 'catering', 'permits', 'decor', 'other']
const statusColors: Record<BudgetLineStatus, any> = {
    estimate: 'neutral',
    quoted: 'blue',
    approved: 'green',
    invoiced: 'amber',
    paid: 'neutral',
}

const quoteStatusLabels: Record<string, any> = {
    estimate: 'neutral',
    quoted: 'blue',
    approved: 'green',
    invoiced: 'amber',
    paid: 'neutral',
}

function AddLineModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
    const { addLine } = useBudget(eventId)
    const [form, setForm] = useState({
        category: 'av' as BudgetCategory,
        description: '',
        supplier: '',
        budgeted: '',
        actual: '',
        vatRate: '0.15',
        quoteRef: '',
        status: 'estimate' as BudgetLineStatus,
        notes: '',
    })

    const budgeted = parseFloat(form.budgeted) || 0
    const actual = parseFloat(form.actual) || 0
    const vat = budgeted * (parseFloat(form.vatRate) || 0.15)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        addLine.mutate({
            eventId,
            category: form.category,
            description: form.description,
            supplier: form.supplier,
            budgeted,
            actual,
            vatRate: parseFloat(form.vatRate) || 0.15,
            quoteRef: form.quoteRef,
            status: form.status,
            attachmentUrl: '',
            notes: form.notes,
        })
        onClose()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as BudgetCategory })}>
                    {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </Select>
                <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BudgetLineStatus })}>
                    <option value="estimate">Estimate</option>
                    <option value="quoted">Quoted</option>
                    <option value="approved">Approved</option>
                    <option value="invoiced">Invoiced</option>
                    <option value="paid">Paid</option>
                </Select>
            </div>
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. FOH sound system package" required />
            <Input label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="e.g. SoundCo SA" />
            <div className="grid grid-cols-2 gap-4">
                <Input label="Budgeted (ZAR, excl VAT)" type="number" value={form.budgeted} onChange={(e) => setForm({ ...form, budgeted: e.target.value })} placeholder="0" required />
                <Input label="Actual (ZAR, excl VAT)" type="number" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} placeholder="0" />
            </div>
            <Input label="Quote Reference" value={form.quoteRef} onChange={(e) => setForm({ ...form, quoteRef: e.target.value })} placeholder="QT-2026-001" />
            <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes…" rows={2} />
            {/* VAT preview */}
            {budgeted > 0 && (
                <div className="bg-surface2 border border-border rounded-sm p-3 text-[12px] space-y-1">
                    <div className="flex justify-between text-ink3"><span>Subtotal (ex VAT)</span><span>{zar(budgeted)}</span></div>
                    <div className="flex justify-between text-ink3"><span>VAT @ 15%</span><span>{zar(vat)}</span></div>
                    <div className="flex justify-between font-bold text-ink border-t border-border pt-1 mt-1"><span>Total (incl VAT)</span><span>{zar(budgeted + vat)}</span></div>
                </div>
            )}
        </form>
    )
}

export function Budget() {
    const [tab, setTab] = useState('events')
    const [addModal, setAddModal] = useState(false)
    const { events, loading: eventsLoading } = useEvents()
    const { selectedEventId, setSelectedEvent } = useAppStore()
    const eventId = selectedEventId || events[0]?.id || ''
    const { lines, loading: linesLoading, totals } = useBudget(eventId)

    const tabs = [
        { key: 'events', label: 'Event Budgets' },
        { key: 'quotes', label: 'Vendor Quotes' },
        { key: 'categories', label: 'Cost Categories' },
        { key: 'invoices', label: 'Invoices & POs' },
    ]

    const grouped = useMemo(() => {
        const map: Record<string, BudgetLine[]> = {}
        lines.forEach((l) => {
            if (!map[l.category]) map[l.category] = []
            map[l.category].push(l)
        })
        return map
    }, [lines])

    const currentEvent = events.find((e) => e.id === eventId)

    return (
        <div className="space-y-4">
            {/* Event selector */}
            {events.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    {events.map((e) => (
                        <button
                            key={e.id}
                            onClick={() => setSelectedEvent(e.id)}
                            className={`px-3 py-1.5 rounded-sm text-[12px] font-semibold transition-all border cursor-pointer ${e.id === eventId
                                    ? 'bg-brand text-white border-brand'
                                    : 'bg-surface text-ink2 border-border hover:border-brand hover:text-brand'
                                }`}
                        >
                            {e.name}
                        </button>
                    ))}
                </div>
            )}

            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {/* Tab: Event Budgets */}
            {tab === 'events' && (
                <div className="grid grid-cols-3 gap-4">
                    {/* Budget lines */}
                    <div className="col-span-2 space-y-4">
                        {/* Summary card */}
                        <Card>
                            <CardHeader
                                title={currentEvent?.name || 'Select an Event'}
                                action={
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        icon={<Plus size={13} />}
                                        onClick={() => setAddModal(true)}
                                        disabled={!eventId}
                                    >
                                        Add Line
                                    </Button>
                                }
                            />
                            {linesLoading ? (
                                <CardBody>
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="py-3 space-y-1.5">
                                            <div className="skeleton h-3 w-32" />
                                            <div className="skeleton h-2 w-full rounded-full" />
                                        </div>
                                    ))}
                                </CardBody>
                            ) : Object.keys(grouped).length === 0 ? (
                                <CardBody>
                                    <div className="py-10 text-center">
                                        <DollarSign size={28} className="text-ink4 mx-auto mb-2" />
                                        <p className="text-ink3 text-[13px] mb-3">No budget lines yet</p>
                                        <Button size="sm" icon={<Plus size={13} />} onClick={() => setAddModal(true)} disabled={!eventId}>
                                            Add first line item
                                        </Button>
                                    </div>
                                </CardBody>
                            ) : (
                                <div>
                                    {Object.entries(grouped).map(([cat, catLines]) => {
                                        const catBudgeted = catLines.reduce((s, l) => s + l.budgeted, 0)
                                        const catActual = catLines.reduce((s, l) => s + l.actual, 0)
                                        return (
                                            <div key={cat}>
                                                <div className="px-[18px] py-2 bg-surface2 border-b border-border flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-ink3 uppercase tracking-wider">{cat}</span>
                                                    <div className="flex items-center gap-3 text-[12px]">
                                                        <span className="text-ink4">Budget: {zar(catBudgeted)}</span>
                                                        <span className={catActual > catBudgeted ? 'text-red font-semibold' : 'text-green'}>
                                                            Actual: {zar(catActual)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {catLines.map((line) => (
                                                    <div key={line.id} className="px-[18px] py-3 flex items-center gap-3 border-b border-border hover:bg-surface2 transition-colors">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[13px] font-medium text-ink">{line.description}</div>
                                                            <div className="text-[11px] text-ink4">{line.supplier} {line.quoteRef ? `· ${line.quoteRef}` : ''}</div>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <div className="text-[13px] font-semibold text-ink">{zar(line.budgeted)}</div>
                                                            <div className={`text-[11px] ${line.actual > line.budgeted ? 'text-red' : 'text-ink4'}`}>
                                                                actual: {zar(line.actual)}
                                                            </div>
                                                        </div>
                                                        <Badge variant={statusColors[line.status]}>{line.status}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                            {totals.budgeted > 0 && (
                                <CardFooter>
                                    <div className="text-[12px] space-y-1 w-full">
                                        <div className="flex justify-between text-ink3"><span>Subtotal (ex VAT)</span><span>{zar(totals.budgeted)}</span></div>
                                        <div className="flex justify-between text-ink3"><span>VAT @ 15%</span><span>{zar(totals.vatAmount)}</span></div>
                                        <div className="flex justify-between font-bold text-ink pt-1 border-t border-border mt-1"><span>TOTAL (incl VAT)</span><span>{zar(totals.budgeted + totals.vatAmount)}</span></div>
                                    </div>
                                </CardFooter>
                            )}
                        </Card>
                    </div>

                    {/* Category breakdown */}
                    <Card>
                        <CardHeader title="Category Breakdown" />
                        <CardBody>
                            {Object.keys(grouped).length === 0 ? (
                                <div className="py-6 text-center text-ink4 text-[12px]">No data yet</div>
                            ) : (
                                <div className="space-y-4">
                                    {Object.entries(grouped).map(([cat, catLines]) => {
                                        const budget = catLines.reduce((s, l) => s + l.budgeted, 0)
                                        const actual = catLines.reduce((s, l) => s + l.actual, 0)
                                        return (
                                            <div key={cat}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-[12px] font-semibold text-ink capitalize">{cat}</span>
                                                    <span className="text-[11px] text-ink4">{zar(budget)}</span>
                                                </div>
                                                <ProgressBar value={actual} max={budget} showLabel />
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Tab: Vendor Quotes */}
            {tab === 'quotes' && (
                <Card>
                    <CardHeader title="Vendor Quotes" action={<Button size="sm" icon={<Plus size={13} />} onClick={() => setAddModal(true)} disabled={!eventId}>New Quote</Button>} />
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="border-b border-border">
                                    {['Vendor', 'Event', 'Category', 'Quote (ZAR)', 'Ref', 'Status'].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-ink3 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {linesLoading
                                    ? Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 6 }).map((_, j) => (
                                                <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full rounded" /></td>
                                            ))}
                                        </tr>
                                    ))
                                    : lines.length === 0
                                        ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-10 text-center text-ink4 text-[13px]">No quotes yet — add your first budget line</td>
                                            </tr>
                                        )
                                        : lines.map((line) => (
                                            <tr key={line.id} className="hover:bg-surface2 transition-colors">
                                                <td className="px-4 py-3 font-medium text-ink">{line.supplier || '—'}</td>
                                                <td className="px-4 py-3 text-ink3">{currentEvent?.name || '—'}</td>
                                                <td className="px-4 py-3 capitalize text-ink3">{line.category}</td>
                                                <td className="px-4 py-3 font-semibold text-ink">{zar(line.budgeted)}</td>
                                                <td className="px-4 py-3 text-ink4">{line.quoteRef || '—'}</td>
                                                <td className="px-4 py-3"><Badge variant={statusColors[line.status]}>{line.status}</Badge></td>
                                            </tr>
                                        ))
                                }
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Tab: Categories */}
            {tab === 'categories' && (
                <Card>
                    <CardHeader title="Cost Categories — All Events" />
                    <CardBody>
                        <div className="space-y-5">
                            {categories.map((cat) => {
                                const catLines = lines.filter((l) => l.category === cat)
                                const budget = catLines.reduce((s, l) => s + l.budgeted, 0)
                                const actual = catLines.reduce((s, l) => s + l.actual, 0)
                                if (budget === 0) return null
                                return (
                                    <div key={cat}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[13px] font-semibold text-ink capitalize">{cat}</span>
                                            <div className="flex items-center gap-4 text-[12px]">
                                                <span className="text-ink4">Budget: {zar(budget)}</span>
                                                <span className={actual > budget ? 'text-red font-semibold' : 'text-ink3'}>Actual: {zar(actual)}</span>
                                            </div>
                                        </div>
                                        <BudgetBar budgeted={budget} actual={actual} />
                                    </div>
                                )
                            }).filter(Boolean)}
                            {lines.length === 0 && (
                                <div className="py-8 text-center text-ink4 text-[13px]">No budget data yet</div>
                            )}
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Tab: Invoices */}
            {tab === 'invoices' && (
                <Card>
                    <CardHeader title="Invoices & Purchase Orders" />
                    <div className="divide-y divide-border">
                        {lines.filter((l) => l.status === 'invoiced' || l.status === 'paid').length === 0 ? (
                            <div className="py-12 text-center">
                                <FileText size={28} className="text-ink4 mx-auto mb-2" />
                                <p className="text-ink3 text-[13px]">No invoiced items yet</p>
                                <p className="text-ink4 text-[12px] mt-1">Mark budget lines as "invoiced" or "paid" to track here</p>
                            </div>
                        ) : (
                            lines.filter((l) => l.status === 'invoiced' || l.status === 'paid').map((line) => (
                                <div key={line.id} className="px-[18px] py-4 flex items-center gap-4 hover:bg-surface2 transition-colors">
                                    <CheckCircle size={16} className={line.status === 'paid' ? 'text-green' : 'text-amber'} />
                                    <div className="flex-1">
                                        <div className="text-[13px] font-medium text-ink">{line.description}</div>
                                        <div className="text-[11px] text-ink4">{line.supplier} · {line.quoteRef}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[13px] font-semibold text-ink">{zar(line.actual || line.budgeted)}</div>
                                        <div className="text-[11px] text-ink4">incl VAT: {zar((line.actual || line.budgeted) * 1.15)}</div>
                                    </div>
                                    <Badge variant={statusColors[line.status]}>{line.status}</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            )}

            {/* Add Line Modal */}
            <Modal
                open={addModal}
                onClose={() => setAddModal(false)}
                title="Add Budget Line"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" size="sm" onClick={() => setAddModal(false)}>Cancel</Button>
                        <Button variant="primary" size="sm" type="submit" form="add-line-form">Add Line Item</Button>
                    </>
                }
            >
                <form id="add-line-form">
                    <AddLineModal eventId={eventId} onClose={() => setAddModal(false)} />
                </form>
            </Modal>
        </div>
    )
}
