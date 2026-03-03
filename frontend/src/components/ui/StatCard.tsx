import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
    label: string
    value: string | number
    change?: string
    changeDirection?: 'up' | 'down' | 'neutral'
    changeLabel?: string
    icon?: React.ReactNode
    loading?: boolean
    className?: string
}

export function StatCard({
    label, value, change, changeDirection = 'neutral', changeLabel, icon, loading, className = ''
}: StatCardProps) {
    const changeColor = changeDirection === 'up'
        ? 'text-green' : changeDirection === 'down'
            ? 'text-red' : 'text-ink4'

    return (
        <div className={`bg-surface border border-border rounded-[10px] shadow-sm p-[18px] ${className}`}>
            <div className="flex items-start justify-between mb-3">
                <span className="text-[11px] font-bold text-ink3 uppercase tracking-wider">{label}</span>
                {icon && (
                    <span className="text-ink4 opacity-60">{icon}</span>
                )}
            </div>
            {loading ? (
                <div className="skeleton h-8 w-32 mb-2" />
            ) : (
                <div className="font-serif text-[28px] font-semibold text-ink leading-none mb-2">
                    {value}
                </div>
            )}
            {change && (
                <div className={`flex items-center gap-1 text-[12px] ${changeColor}`}>
                    {changeDirection === 'up' && <TrendingUp size={12} />}
                    {changeDirection === 'down' && <TrendingDown size={12} />}
                    {changeDirection === 'neutral' && <Minus size={12} />}
                    <span>{change}</span>
                    {changeLabel && <span className="text-ink4">{changeLabel}</span>}
                </div>
            )}
        </div>
    )
}
