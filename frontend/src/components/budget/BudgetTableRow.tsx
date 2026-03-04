import React, { useState, useRef, useEffect } from 'react'
import { Pencil, Trash2, MoreVertical, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { BudgetLine, BudgetLineStatus } from '@/types/budget'

const zar = (n: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n)

const STATUS_COLOR: Record<BudgetLineStatus, any> = {
    estimate: 'neutral',
    quoted: 'blue',
    approved: 'green',
    invoiced: 'amber',
    paid: 'neutral',
}

interface BudgetTableRowProps {
    line: BudgetLine
    isAdmin: boolean
    isEditing: boolean
    onEdit: () => void
    onCancel: () => void
    onSave: (data: Partial<BudgetLine>, oldData: BudgetLine) => void
    onDelete: (id: string, oldData: BudgetLine) => void
}

export function BudgetTableRow({
    line,
    isAdmin,
    isEditing,
    onEdit,
    onCancel,
    onSave,
    onDelete,
}: BudgetTableRowProps) {
    const [form, setForm] = useState({
        budgeted: line.budgeted.toString(),
        actual: line.actual.toString(),
        status: line.status,
        supplier: line.supplier || '',
        notes: line.notes || '',
    })
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    const lineOver = line.actual > line.budgeted && line.actual > 0

    // Detect click outside for menu
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false)
            }
        }
        if (showMenu) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showMenu])

    // Detect click outside for edit mode -> implied save/cancel?
    // Spec says: "Clicking anywhere outside the row, or pressing Enter, saves and exits edit mode. Escape cancels."
    const rowRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        function handleGlobalClick(e: MouseEvent) {
            if (isEditing && rowRef.current && !rowRef.current.contains(e.target as Node)) {
                // Save and exit
                handleSave()
            }
        }
        if (isEditing) {
            // Need a slight delay to avoid immediate trigger from the edit button click
            const timer = setTimeout(() => {
                document.addEventListener('mousedown', handleGlobalClick)
            }, 100)
            return () => {
                clearTimeout(timer)
                document.removeEventListener('mousedown', handleGlobalClick)
            }
        }
    }, [isEditing, form])

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!isEditing) return
            if (e.key === 'Escape') {
                handleCancel()
            } else if (e.key === 'Enter') {
                handleSave()
            }
        }
        if (isEditing) {
            document.addEventListener('keydown', handleKeyDown)
            return () => document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isEditing, form])

    const handleCancel = () => {
        setForm({
            budgeted: line.budgeted.toString(),
            actual: line.actual.toString(),
            status: line.status,
            supplier: line.supplier || '',
            notes: line.notes || '',
        })
        onCancel()
    }

    const handleSave = () => {
        const bdg = parseFloat(form.budgeted) || 0
        const act = parseFloat(form.actual) || 0

        const hasChanges =
            bdg !== line.budgeted ||
            act !== line.actual ||
            form.status !== line.status ||
            form.supplier !== (line.supplier || '') ||
            form.notes !== (line.notes || '')

        if (hasChanges) {
            onSave({
                budgeted: bdg,
                actual: act,
                status: form.status,
                supplier: form.supplier,
                notes: form.notes,
            }, line)
        } else {
            onCancel() // just exit
        }
    }

    const handleDelete = () => {
        if (window.confirm('Delete this line item? This cannot be undone.')) {
            onDelete(line.id, line)
        }
        setShowMenu(false)
    }

    if (isEditing) {
        return (
            <div ref={rowRef} className="px-[18px] py-3 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center bg-brand/5 border-b border-brand-200">
                <div className="space-y-2">
                    <div className="text-[13px] font-medium text-ink flex items-center gap-2">
                        {line.description}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={form.supplier}
                            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                            placeholder="Supplier"
                            className="h-7 text-[12px]"
                        />
                        <Input
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            placeholder="Notes"
                            className="h-7 text-[12px]"
                        />
                    </div>
                </div>
                <div className="w-24">
                    <Input
                        type="number"
                        value={form.budgeted}
                        onChange={(e) => setForm({ ...form, budgeted: e.target.value })}
                        className="h-7 text-[12px] text-right"
                    />
                </div>
                <div className="w-24">
                    <Input
                        type="number"
                        value={form.actual}
                        onChange={(e) => setForm({ ...form, actual: e.target.value })}
                        className="h-7 text-[12px] text-right"
                    />
                </div>
                <div className="w-24 flex flex-col gap-2 relative items-end">
                    <Select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as BudgetLineStatus })}
                        className="h-7 text-[12px]"
                    >
                        <option value="estimate">Estimate</option>
                        <option value="pending">Pending</option>
                        <option value="quoted">Quoted</option>
                        <option value="approved">Approved</option>
                        <option value="invoiced">Invoiced</option>
                        <option value="paid">Paid</option>
                        <option value="disputed">Disputed</option>
                    </Select>
                    <div className="flex gap-1 justify-end w-full">
                        <button onClick={handleSave} className="p-1 rounded text-brand hover:bg-brand/10 transition-colors" title="Save (Enter)">
                            <Check size={14} />
                        </button>
                        <button onClick={handleCancel} className="p-1 rounded text-ink4 hover:bg-surface3 transition-colors" title="Cancel (Esc)">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="group relative px-[18px] py-3 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center border-b border-border hover:bg-surface2 transition-colors">
            <div className="pl-2">
                <div className="text-[13px] font-medium text-ink">{line.description}</div>
                <div className="text-[11px] text-ink4">
                    {line.supplier}
                    {line.quoteRef ? ` · ${line.quoteRef}` : ''}
                </div>
                {line.notes && <div className="text-[10px] text-ink4 mt-0.5 italic">{line.notes}</div>}
            </div>

            <div className="text-[13px] font-semibold text-ink text-right w-24">
                {zar(line.budgeted)}
            </div>

            <div className={`text-[13px] font-semibold text-right w-24 ${lineOver ? 'text-red' : line.actual > 0 ? 'text-ink' : 'text-ink4'}`}>
                {line.actual > 0 ? zar(line.actual) : '—'}
            </div>

            <div className="w-24 flex items-center justify-end gap-1 h-full">
                <Badge variant={STATUS_COLOR[line.status] || 'neutral'}>
                    {line.status}
                </Badge>

                {isAdmin && (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-1 text-ink4 hover:text-ink transition-all rounded hover:bg-surface3 ${showMenu ? 'opacity-100 bg-surface3 text-ink' : 'opacity-0 group-hover:opacity-100'}`}
                        >
                            <MoreVertical size={14} />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-surface border border-border rounded shadow-md z-20 overflow-hidden">
                                <button
                                    onClick={() => {
                                        onEdit()
                                        setShowMenu(false)
                                    }}
                                    className="w-full text-left px-3 py-2 text-[12px] text-ink hover:bg-surface2 flex items-center gap-2"
                                >
                                    <Pencil size={12} />
                                    Edit Line
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-full text-left px-3 py-2 text-[12px] text-red hover:bg-red/5 flex items-center gap-2"
                                >
                                    <Trash2 size={12} />
                                    Delete Line
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
