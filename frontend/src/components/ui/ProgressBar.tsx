import React from 'react'

interface ProgressBarProps {
    value: number       // actual
    max: number         // budgeted
    showLabel?: boolean
    className?: string
}

export function ProgressBar({ value, max, showLabel, className = '' }: ProgressBarProps) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
    const isOver = value > max
    const color = isOver ? 'bg-red' : pct > 85 ? 'bg-amber' : 'bg-green'

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="flex-1 h-1.5 bg-bg2 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {showLabel && (
                <span className={`text-[11px] font-semibold w-9 text-right ${isOver ? 'text-red' : 'text-ink3'}`}>
                    {Math.round(pct)}%
                </span>
            )}
        </div>
    )
}

interface BudgetBarProps {
    budgeted: number
    actual: number
    className?: string
}

export function BudgetBar({ budgeted, actual, className = '' }: BudgetBarProps) {
    const isOver = actual > budgeted
    const pct = budgeted > 0 ? Math.min((actual / budgeted) * 100, 100) : 0
    const color = isOver ? 'bg-red-light border-red' : 'bg-green-light border-green'

    return (
        <div className={`space-y-1 ${className}`}>
            <div className="flex justify-between text-[11px] text-ink4">
                <span>R {budgeted.toLocaleString()}</span>
                <span className={isOver ? 'text-red font-semibold' : 'text-green font-semibold'}>
                    {isOver ? '▲' : ''} R {actual.toLocaleString()}
                </span>
            </div>
            <div className="h-2 bg-bg2 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${isOver ? 'bg-red' : 'bg-brand'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}
