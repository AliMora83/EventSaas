import React from 'react'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { useAppStore, Toast } from '@/store/useAppStore'

type AlertVariant = 'red' | 'amber' | 'green' | 'blue'

const alertStyles: Record<AlertVariant, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    red: { bg: 'bg-red-light', border: 'border-red/30', text: 'text-red', icon: <AlertCircle size={15} /> },
    amber: { bg: 'bg-amber-light', border: 'border-amber/30', text: 'text-amber', icon: <AlertTriangle size={15} /> },
    green: { bg: 'bg-green-light', border: 'border-green/30', text: 'text-green', icon: <CheckCircle size={15} /> },
    blue: { bg: 'bg-blue-light', border: 'border-blue/30', text: 'text-blue', icon: <Info size={15} /> },
}

interface AlertBannerProps {
    variant: AlertVariant
    message: React.ReactNode
    icon?: React.ReactNode
    onDismiss?: () => void
    className?: string
}

export function AlertBanner({ variant, message, icon, onDismiss, className = '' }: AlertBannerProps) {
    const style = alertStyles[variant]
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-sm border ${style.bg} ${style.border} ${style.text} ${className}`}>
            {icon || style.icon}
            <span className="flex-1 text-[13px] font-medium">{message}</span>
            {onDismiss && (
                <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100 cursor-pointer">
                    <X size={14} />
                </button>
            )}
        </div>
    )
}

// Toast notification system
const toastTypeStyles: Record<Toast['type'], { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    success: { bg: 'bg-ink', border: 'border-green/30', text: 'text-white', icon: <CheckCircle size={14} className="text-green" /> },
    error: { bg: 'bg-ink', border: 'border-red/30', text: 'text-white', icon: <AlertCircle size={14} className="text-red" /> },
    warning: { bg: 'bg-ink', border: 'border-amber/30', text: 'text-white', icon: <AlertTriangle size={14} className="text-amber" /> },
    info: { bg: 'bg-ink', border: 'border-blue/30', text: 'text-white', icon: <Info size={14} className="text-blue" /> },
}

export function ToastContainer() {
    const { toasts, removeToast } = useAppStore()
    if (toasts.length === 0) return null
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => {
                const style = toastTypeStyles[toast.type]
                return (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-[10px] border shadow-lg pointer-events-auto
              animate-in slide-in-from-bottom-4 duration-200
              ${style.bg} ${style.border} ${style.text}`}
                    >
                        {style.icon}
                        <span className="text-[13px] font-medium">{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="ml-1 opacity-50 hover:opacity-100 cursor-pointer">
                            <X size={13} />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
