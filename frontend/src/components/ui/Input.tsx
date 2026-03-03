import React, { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helper?: string
    icon?: React.ReactNode
    iconRight?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helper, icon, iconRight, className = '', id, ...rest }, ref) => {
        const inputId = id || `input-${label?.toLowerCase().replace(/\s/g, '-')}`
        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label htmlFor={inputId} className="text-[12px] font-semibold text-ink2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink4">
                            {icon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={`w-full h-9 border rounded-sm px-3 text-[13px] text-ink bg-surface placeholder:text-ink4
              border-border transition-all
              focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20
              disabled:bg-bg2 disabled:text-ink3
              ${error ? 'border-red' : ''}
              ${icon ? 'pl-9' : ''}
              ${iconRight ? 'pr-9' : ''}
              ${className}`}
                        {...rest}
                    />
                    {iconRight && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink4">
                            {iconRight}
                        </span>
                    )}
                </div>
                {error && <p className="text-[11px] text-red">{error}</p>}
                {helper && !error && <p className="text-[11px] text-ink4">{helper}</p>}
            </div>
        )
    }
)

Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    children: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, children, className = '', id, ...rest }, ref) => {
        const selectId = id || `select-${label?.toLowerCase().replace(/\s/g, '-')}`
        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label htmlFor={selectId} className="text-[12px] font-semibold text-ink2">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={`w-full h-9 border rounded-sm px-3 text-[13px] text-ink bg-surface
            border-border transition-all cursor-pointer appearance-none
            focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20
            ${error ? 'border-red' : ''}
            ${className}`}
                    {...rest}
                >
                    {children}
                </select>
                {error && <p className="text-[11px] text-red">{error}</p>}
            </div>
        )
    }
)

Select.displayName = 'Select'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className = '', id, ...rest }, ref) => {
        const textId = id || `textarea-${label?.toLowerCase().replace(/\s/g, '-')}`
        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label htmlFor={textId} className="text-[12px] font-semibold text-ink2">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textId}
                    className={`w-full border rounded-sm px-3 py-2 text-[13px] text-ink bg-surface placeholder:text-ink4
            border-border transition-all resize-y
            focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20
            ${error ? 'border-red' : ''}
            ${className}`}
                    rows={3}
                    {...rest}
                />
                {error && <p className="text-[11px] text-red">{error}</p>}
            </div>
        )
    }
)

Textarea.displayName = 'Textarea'
