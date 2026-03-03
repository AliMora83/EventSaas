import React from 'react'

interface AvatarProps {
    initials: string
    color?: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const sizeStyles = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-[12px]',
    lg: 'w-10 h-10 text-[14px]',
}

export function Avatar({ initials, color = '#c2410c', size = 'md', className = '' }: AvatarProps) {
    return (
        <div
            className={`rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${sizeStyles[size]} ${className}`}
            style={{ backgroundColor: color }}
            title={initials}
        >
            {initials}
        </div>
    )
}
