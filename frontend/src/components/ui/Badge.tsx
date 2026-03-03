import React from 'react'

type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'orange' | 'neutral' | 'brand'

const variantStyles: Record<BadgeVariant, string> = {
    green: 'bg-green-light text-green',
    red: 'bg-red-light text-red',
    amber: 'bg-amber-light text-amber',
    blue: 'bg-blue-light text-blue',
    orange: 'bg-orange-light text-orange',
    brand: 'bg-brand-light text-brand',
    neutral: 'bg-bg2 text-ink3',
}

interface BadgeProps {
    variant?: BadgeVariant
    children: React.ReactNode
    className?: string
}

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold uppercase tracking-wide ${variantStyles[variant]} ${className}`}
        >
            {children}
        </span>
    )
}
