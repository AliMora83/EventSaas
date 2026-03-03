import React from 'react'

interface CardProps {
    children: React.ReactNode
    className?: string
}

interface CardHeaderProps {
    title: string
    action?: React.ReactNode
    className?: string
}

interface CardFooterProps {
    children: React.ReactNode
    className?: string
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div className={`bg-surface border border-border rounded-[10px] shadow-sm overflow-hidden ${className}`}>
            {children}
        </div>
    )
}

export function CardHeader({ title, action, className = '' }: CardHeaderProps) {
    return (
        <div className={`px-[18px] py-[14px] border-b border-border flex items-center justify-between ${className}`}>
            <h3 className="text-[12.5px] font-bold text-ink uppercase tracking-wide">{title}</h3>
            {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
    )
}

export function CardBody({ children, className = '' }: CardProps) {
    return (
        <div className={`p-[18px] ${className}`}>
            {children}
        </div>
    )
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
    return (
        <div className={`px-[18px] py-[14px] border-t border-border bg-surface2 ${className}`}>
            {children}
        </div>
    )
}
