import React from 'react'

interface TabItem {
    key: string
    label: string
    count?: number
}

interface TabsProps {
    tabs: TabItem[]
    active: string
    onChange: (key: string) => void
    className?: string
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
    return (
        <div className={`flex border-b border-border ${className}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    id={`tab-${tab.key}`}
                    onClick={() => onChange(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold border-b-2 transition-all cursor-pointer ${active === tab.key
                            ? 'border-brand text-brand'
                            : 'border-transparent text-ink3 hover:text-ink2 hover:border-border2'
                        }`}
                >
                    {tab.label}
                    {tab.count !== undefined && (
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-sm font-bold ${active === tab.key ? 'bg-brand-light text-brand' : 'bg-bg2 text-ink4'
                            }`}>
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    )
}
