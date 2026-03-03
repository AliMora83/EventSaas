import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-brand text-white hover:bg-[#b03a0a] shadow-sm',
    secondary: 'bg-surface border border-border text-ink2 hover:bg-bg2 shadow-sm',
    ghost: 'text-ink2 hover:bg-bg2 hover:text-ink',
    danger: 'bg-red text-white hover:bg-[#b91c1c] shadow-sm',
}

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-7 px-3 text-[12px] rounded-sm',
    md: 'h-8 px-4 text-[13px] rounded',
    lg: 'h-10 px-5 text-[14px] rounded',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    icon?: React.ReactNode
    children?: React.ReactNode
}

export function Button({
    variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...rest
}: ButtonProps) {
    return (
        <button
            className={`inline-flex items-center gap-1.5 font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            disabled={disabled || loading}
            {...rest}
        >
            {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : icon}
            {children}
        </button>
    )
}
