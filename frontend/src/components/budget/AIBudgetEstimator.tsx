import React, { useState } from 'react'
import { Sparkles, AlertTriangle, RefreshCw, CheckCircle, Save } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { estimateEventBudget } from '@/services/aiService'
import { EstimateEventParams, BudgetEstimateResult } from '@/types/ai'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'

const EVENT_TYPES = [
    'Outdoor Music Festival', 'Indoor Concert', 'Corporate Gala',
    'Conference', 'Product Launch', 'Awards Ceremony', 'Community Event'
]

const CITIES = [
    'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'
]

const zar = (n: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n)

export function AIBudgetEstimator({ eventId, eventName, onSaveComplete }: { eventId?: string; eventName?: string; onSaveComplete?: () => void }) {
    const { orgId } = useAuthStore()
    const addToast = useAppStore((s: any) => s.addToast)
    const [form, setForm] = useState<EstimateEventParams>({
        eventName: eventName || '',
        eventType: EVENT_TYPES[0],
        pax: 100,
        days: 1,
        city: CITIES[0],
        notes: ''
    })

    const [result, setResult] = useState<BudgetEstimateResult | null>(null)
    const [open, setOpen] = useState(false)

    const estimateMutation = useMutation({
        mutationFn: estimateEventBudget,
        onSuccess: (data) => {
            setResult(data)
        },
        onError: (error) => {
            console.error('Estimate failed', error)
        }
    })

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault()
        setResult(null)
        estimateMutation.mutate(form)
    }

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!orgId || !eventId || !result) throw new Error('Missing context to save')
            const colRef = collection(db, 'organisations', orgId, 'events', eventId, 'budgetLines')

            // Save each line item
            const promises = result.lineItems.map(item => {
                return addDoc(colRef, {
                    eventName: eventName,
                    category: item.category,
                    supplier: item.supplier,
                    description: item.description,
                    budgeted: item.budgeted,
                    actual: 0,
                    notes: item.notes || '',
                    status: 'estimate',
                    source: 'ai-generated',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    vatRate: 15, // Defaulting to 15% as per instructions
                })
            })

            await Promise.all(promises)
        },
        onSuccess: () => {
            addToast({ type: 'success', message: 'Budget lines saved successfully' })
            if (onSaveComplete) onSaveComplete()
        },
        onError: (error) => {
            addToast({ type: 'error', message: 'Failed to save budget lines: ' + (error as Error).message })
        }
    })

    if (!open) {
        return (
            <div
                className="bg-brand-light border border-[#fed7aa] rounded-lg p-4 flex items-center justify-between shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                style={{ background: 'linear-gradient(135deg, #fff7ed, #fef3c7)' }}
                onClick={() => setOpen(true)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-ink">✨ AI Budget Assistant</div>
                        <div className="text-[12px] text-ink3">Generate an itemised budget estimate for your event structure instantly.</div>
                    </div>
                </div>
                <Button variant="primary" size="sm">Start Estimate</Button>
            </div>
        )
    }

    return (
        <div className="border border-[#fed7aa] rounded-lg shadow-sm" style={{ background: 'linear-gradient(135deg, #fff7ed, #fef3c7)' }}>
            <div className="flex items-center justify-between p-4 border-b border-[#fed7aa]">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-brand" />
                    <span className="font-bold text-ink">AI Budget Assistant</span>
                </div>
                <button onClick={() => setOpen(false)} className="text-ink4 hover:text-ink text-[13px]">Close</button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side: Form */}
                <form onSubmit={handleGenerate} className="space-y-4">
                    <Input label="Event Name" value={form.eventName} onChange={e => setForm({ ...form, eventName: e.target.value })} required />

                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Event Type" value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value })}>
                            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </Select>
                        <Select label="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Attendance (Pax)" type="number" min={1} value={form.pax} onChange={e => setForm({ ...form, pax: parseInt(e.target.value) || 0 })} required />
                        <Input label="Production Days" type="number" min={1} value={form.days} onChange={e => setForm({ ...form, days: parseInt(e.target.value) || 0 })} required />
                    </div>

                    <Textarea label="Notes (Optional)" placeholder="e.g. Needs a drone operator, high-end VIP catering..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />

                    <Button type="submit" variant="primary" className="w-full" icon={<Sparkles size={14} />} loading={estimateMutation.isPending}>
                        Generate Budget Estimate
                    </Button>

                    {estimateMutation.isError && (
                        <div className="p-3 bg-red/10 border border-red/30 rounded text-red text-[13px] flex items-start gap-2">
                            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                            <div>
                                <strong className="block mb-0.5">Estimation Failed</strong>
                                The AI encountered an error generating the budget. Please try again.
                            </div>
                        </div>
                    )}
                </form>

                {/* Right side: Results */}
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    {!result && !estimateMutation.isPending && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-ink4">
                            <Sparkles size={32} className="opacity-20 mb-3" />
                            <p className="text-[14px]">Fill in the details to generate an instant budget estimate.</p>
                        </div>
                    )}

                    {estimateMutation.isPending && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-brand/5">
                            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-[14px] font-medium text-brand">Analyzing market rates...</p>
                            <p className="text-[12px] text-ink3 mt-1">Applying typical costs for {form.city}</p>
                        </div>
                    )}

                    {result && (
                        <div className="flex flex-col h-full max-h-[500px]">
                            <div className="p-4 border-b border-border bg-surface2/50 shrink-0">
                                <div className="text-[12px] text-ink3 font-medium mb-1">Estimated Total (incl VAT)</div>
                                <div className="text-[28px] font-serif font-bold text-ink">{zar(result.totalIncVat)}</div>
                                <div className="mt-2 text-[13px] text-ink leading-relaxed">{result.summary}</div>
                            </div>

                            <div className="p-4 overflow-y-auto flex-1 space-y-4">
                                <div>
                                    <h4 className="text-[11px] font-bold text-ink4 tracking-wider uppercase mb-2">Itemised Breakdown</h4>
                                    <div className="space-y-2">
                                        {result.lineItems.map((item, i) => (
                                            <div key={i} className="flex justify-between items-start text-[13px] p-2 bg-surface2 rounded border border-border">
                                                <div>
                                                    <div className="font-semibold text-ink">{item.description}</div>
                                                    <div className="text-[11px] text-ink4 mt-0.5">{item.category} • {item.supplier}</div>
                                                </div>
                                                <div className="font-semibold text-ink shrink-0 ml-3">{zar(item.budgeted)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {result.savingsTips?.length > 0 && (
                                    <div className="bg-[#d1fae5]/30 border border-[#d1fae5] rounded p-3">
                                        <h4 className="text-[11px] font-bold text-green tracking-wider uppercase mb-2 flex items-center gap-1">
                                            <CheckCircle size={12} /> Saving Tips
                                        </h4>
                                        <ul className="text-[12px] text-ink list-disc list-inside space-y-1">
                                            {result.savingsTips.map((tip, i) => <li key={i}>{tip}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-border bg-surface shrink-0">
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    icon={<Save size={14} />}
                                    onClick={() => saveMutation.mutate()}
                                    loading={saveMutation.isPending}
                                    disabled={!eventId || result.lineItems.length === 0}
                                >
                                    Save as Budget Lines
                                </Button>
                                {!eventId && <div className="text-[11px] text-center text-ink4 mt-2">Open an event to save budget lines.</div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
