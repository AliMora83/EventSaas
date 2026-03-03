import React from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps {
    open: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
}

export function Modal({ open, onClose, title, children, footer, size = 'md', className = '' }: ModalProps) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
                onClick={onClose}
            />
            {/* Panel */}
            <div className={`relative bg-surface rounded-[10px] shadow-lg w-full ${sizeStyles[size]} ${className} max-h-[90vh] flex flex-col`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                    <h2 className="font-serif text-[18px] font-semibold italic text-ink">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-ink4 hover:text-ink transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {children}
                </div>
                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0 bg-surface2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
