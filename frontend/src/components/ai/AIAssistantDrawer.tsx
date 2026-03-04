import React, { useEffect, useState } from 'react'
import { Bot, X, Sparkles, Lightbulb, TrendingDown, DollarSign } from 'lucide-react'
import { useAIStore } from '@/store/aiStore'
import { useAuthStore } from '@/store/useAuthStore'
import { collection, query, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import { suggestBudgetSavings } from '@/services/aiService'
import { useMutation } from '@tanstack/react-query'
import { SavingsResult } from '@/types/ai'
import { Button } from '@/components/ui/Button'
import { AIBudgetEstimator } from '@/components/budget/AIBudgetEstimator'
import { useLocation } from 'react-router-dom'

const zar = (n: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n)

export function AIAssistantDrawer() {
    const { isOpen, activeTab, openDrawer, closeDrawer } = useAIStore()
    const { orgId } = useAuthStore()
    const location = useLocation()
    const [savingsResult, setSavingsResult] = useState<SavingsResult | null>(null)

    const savingsMutation = useMutation({
        mutationFn: async () => {
            if (!orgId) throw new Error('No organisation context')

            // In a real app we'd query all events and then their under-collections using a collection group query
            // Standard subcollection fetch per event could be expensive, so assuming there is a collectionGroup
            const q = query(collection(db, 'organisations', orgId, 'events'))
            const eventsSnap = await getDocs(q)

            let allLines: any[] = []
            for (const eventDoc of eventsSnap.docs) {
                const linesQ = collection(db, 'organisations', orgId, 'events', eventDoc.id, 'budgetLines')
                const linesSnap = await getDocs(linesQ)
                linesSnap.forEach(d => allLines.push({ ...d.data(), eventName: eventDoc.data().name }))
            }

            if (allLines.length === 0) {
                return null
            }

            return suggestBudgetSavings(allLines)
        },
        onSuccess: (data) => {
            if (data) setSavingsResult(data)
        }
    })

    if (location.pathname === '/login') return null

    return (
        <>
            {/* FAB Button */}
            {!isOpen && (
                <button
                    onClick={() => openDrawer('estimate')}
                    className="fixed bottom-6 right-6 w-13 h-13 rounded-full shadow-xl flex items-center justify-center text-white z-40 transition-transform hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #c2410c, #ea580c)' }}
                >
                    <Bot size={28} />
                </button>
            )}

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={closeDrawer}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 bottom-0 w-[460px] max-w-[100vw] bg-surface shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ borderLeft: '1px solid var(--color-border)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border" style={{ background: 'linear-gradient(135deg, #fff7ed, #fef3c7)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand/10 flex flex-col items-center justify-center text-brand">
                            <Bot size={22} />
                        </div>
                        <div>
                            <div className="font-bold text-ink">Gemini AI Assistant</div>
                            <div className="text-[12px] text-ink3">EventSaaS Budget Intelligence</div>
                        </div>
                    </div>
                    <button onClick={closeDrawer} className="text-ink4 hover:text-ink p-1.5 rounded-full hover:bg-black/5 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => openDrawer('estimate')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold border-b-2 transition-colors ${activeTab === 'estimate' ? 'border-brand text-brand' : 'border-transparent text-ink4 hover:text-ink'}`}
                    >
                        <Sparkles size={14} /> ✨ Estimate Event
                    </button>
                    <button
                        onClick={() => openDrawer('savings')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold border-b-2 transition-colors ${activeTab === 'savings' ? 'border-brand text-brand' : 'border-transparent text-ink4 hover:text-ink'}`}
                    >
                        <Lightbulb size={14} /> 💡 Suggest Savings
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-[#fafafa]">
                    {activeTab === 'estimate' && (
                        <div className="p-4">
                            <AIBudgetEstimator onSaveComplete={closeDrawer} />
                        </div>
                    )}

                    {activeTab === 'savings' && (
                        <div className="p-5 flex flex-col h-full">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-green/10 text-green rounded-full flex items-center justify-center mx-auto mb-3">
                                    <TrendingDown size={24} />
                                </div>
                                <h3 className="font-bold text-ink text-[16px]">Analyse My Budgets</h3>
                                <p className="text-[13px] text-ink3 mt-1">
                                    AI will check all your event budgets against realistic supplier rates
                                    and find opportunities to save money without compromising quality.
                                </p>
                            </div>

                            <Button
                                variant="primary"
                                className="w-full mb-6"
                                icon={<Sparkles size={14} />}
                                onClick={() => savingsMutation.mutate()}
                                loading={savingsMutation.isPending}
                            >
                                Analyse Now
                            </Button>

                            {savingsMutation.isPending && (
                                <div className="py-8 text-center text-brand flex flex-col items-center">
                                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-3" />
                                    <div className="text-[13px] font-medium">Crunching numbers down...</div>
                                </div>
                            )}

                            {savingsResult === null && savingsMutation.isSuccess && (
                                <div className="p-4 bg-surface rounded border border-border text-center text-ink3 text-[13px]">
                                    No budget lines found to analyze.
                                </div>
                            )}

                            {savingsResult && (
                                <div className="space-y-4 pb-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-surface rounded border border-border p-3 text-center">
                                            <div className="text-[11px] font-semibold text-ink4 uppercase tracking-wide">Total Spend</div>
                                            <div className="text-[16px] font-bold text-ink mt-1">{zar(savingsResult.totalSpend)}</div>
                                        </div>
                                        <div className="bg-[#d1fae5] rounded border border-[#a7f3d0] p-3 text-center">
                                            <div className="text-[11px] font-semibold text-green uppercase tracking-wide">Potential Saving</div>
                                            <div className="text-[16px] font-bold text-green mt-1">{zar(savingsResult.potentialSaving)}</div>
                                        </div>
                                    </div>

                                    <div className="bg-brand/5 border border-brand/20 rounded p-4 text-[13px] leading-relaxed text-ink font-medium">
                                        {savingsResult.overallAdvice}
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-[12px] font-bold text-ink4 uppercase tracking-wider pl-1">Specific Suggestions</h4>
                                        {savingsResult.suggestions.map((s, i) => (
                                            <div key={i} className="bg-surface rounded border border-border p-4 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[12px] font-bold text-brand uppercase tracking-wide">{s.category}</span>
                                                    <span className="text-[12px] font-bold text-green px-2 py-0.5 bg-green/10 rounded">
                                                        Save {zar(s.estimatedSaving)}
                                                    </span>
                                                </div>
                                                <div className="text-[13px] font-semibold text-ink mb-1">{s.issue}</div>
                                                <div className="text-[13px] text-ink3">{s.suggestion}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
