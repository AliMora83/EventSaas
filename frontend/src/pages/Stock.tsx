import React, { useState, useMemo } from 'react'
import { Plus, Package, Search, Filter } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { useEquipment } from '@/hooks/useEquipment'
import { EquipmentItem, EquipmentCategory, EquipmentCondition } from '@/types/equipment'

const categories: EquipmentCategory[] = ['lighting', 'audio', 'staging', 'rigging', 'video', 'power', 'communication', 'other']

const conditionColor: Record<EquipmentCondition, any> = {
    excellent: 'green',
    good: 'neutral',
    fair: 'amber',
    repair: 'red',
}

const categoryIcons: Record<EquipmentCategory, string> = {
    lighting: '💡', audio: '🔊', staging: '⚡', rigging: '🏗️',
    video: '🎬', power: '🔌', communication: '📡', other: '📦',
}

function AddEquipmentModal({ onClose }: { onClose: () => void }) {
    const { addItem } = useEquipment()
    const [form, setForm] = useState({
        name: '', category: 'audio' as EquipmentCategory, subcategory: '',
        quantity: '', unit: 'units', purchaseValue: '', condition: 'good' as EquipmentCondition,
        serialNumbers: '', icon: '📦', notes: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        addItem.mutate({
            name: form.name, category: form.category, subcategory: form.subcategory,
            quantity: parseInt(form.quantity) || 1,
            unit: form.unit,
            purchaseValue: parseFloat(form.purchaseValue) || 0,
            condition: form.condition,
            serialNumbers: form.serialNumbers.split('\n').filter(Boolean),
            icon: categoryIcons[form.category],
            notes: form.notes,
        })
        onClose()
    }

    return (
        <form id="add-equipment-form" onSubmit={handleSubmit} className="space-y-4">
            <Input label="Equipment Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. d&b Y-Series Sub" required />
            <div className="grid grid-cols-2 gap-4">
                <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as EquipmentCategory, icon: categoryIcons[e.target.value as EquipmentCategory] })}>
                    {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </Select>
                <Select label="Condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as EquipmentCondition })}>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="repair">In Repair</option>
                </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="1" required />
                <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="units" />
                <Input label="Purchase Value (ZAR)" type="number" value={form.purchaseValue} onChange={(e) => setForm({ ...form, purchaseValue: e.target.value })} placeholder="0" />
            </div>
            <Textarea label="Serial Numbers (one per line)" value={form.serialNumbers} onChange={(e) => setForm({ ...form, serialNumbers: e.target.value })} placeholder="SN-001&#10;SN-002" rows={2} />
            <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        </form>
    )
}

function EquipmentCard({ item }: { item: EquipmentItem }) {
    return (
        <div className="bg-surface border border-border rounded-[10px] shadow-sm p-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
                <span className="text-[24px]">{item.icon}</span>
                <Badge variant={conditionColor[item.condition]}>{item.condition}</Badge>
            </div>
            <h3 className="font-semibold text-[13px] text-ink leading-snug mb-1">{item.name}</h3>
            <p className="text-[11px] text-ink4 capitalize mb-3">{item.category}{item.subcategory ? ` · ${item.subcategory}` : ''}</p>
            <div className="flex items-center justify-between">
                <div>
                    <span className="font-serif text-[20px] font-semibold text-ink">{item.quantity}</span>
                    <span className="text-[11px] text-ink4 ml-1">{item.unit}</span>
                </div>
                {item.purchaseValue > 0 && (
                    <span className="text-[11px] text-ink4">
                        R {item.purchaseValue.toLocaleString()}
                    </span>
                )}
            </div>
        </div>
    )
}

export function Stock() {
    const [tab, setTab] = useState('inventory')
    const [addModal, setAddModal] = useState(false)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const { items, loading } = useEquipment()

    const filtered = useMemo(() => {
        return items.filter((item) => {
            const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
            const matchCat = categoryFilter === 'all' || item.category === categoryFilter
            return matchSearch && matchCat
        })
    }, [items, search, categoryFilter])

    const tabs = [
        { key: 'inventory', label: 'All Inventory', count: items.length },
        { key: 'calendar', label: 'Availability' },
        { key: 'subrentals', label: 'Sub-Rentals' },
        { key: 'maintenance', label: 'Maintenance Log' },
    ]

    return (
        <div className="space-y-4">
            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {tab === 'inventory' && (
                <>
                    {/* Toolbar */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-xs">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink4" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search equipment…"
                                className="w-full h-9 pl-8 pr-3 border border-border rounded-sm bg-surface text-[13px] text-ink placeholder:text-ink4 focus:outline-none focus:border-brand transition-all"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="h-9 border border-border rounded-sm px-3 text-[13px] bg-surface text-ink focus:outline-none focus:border-brand cursor-pointer"
                        >
                            <option value="all">All Categories</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
                        </select>
                        <div className="flex-1" />
                        <Button size="sm" icon={<Plus size={13} />} onClick={() => setAddModal(true)}>
                            Add Equipment
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 text-[13px]">
                        <span className="text-ink3"><strong className="text-ink">{items.length}</strong> total items</span>
                        <span className="text-ink3"><strong className="text-green">{items.filter((i) => i.condition !== 'repair').length}</strong> operational</span>
                        <span className="text-ink3"><strong className="text-red">{items.filter((i) => i.condition === 'repair').length}</strong> in repair</span>
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-surface border border-border rounded-[10px] p-4 space-y-2">
                                    <div className="skeleton h-8 w-8 rounded" />
                                    <div className="skeleton h-4 w-3/4" />
                                    <div className="skeleton h-3 w-1/2" />
                                    <div className="skeleton h-6 w-12" />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <Package size={36} className="text-ink4 mx-auto mb-3" />
                            <p className="text-ink3 text-[14px] font-medium mb-1">No equipment found</p>
                            <p className="text-ink4 text-[12px] mb-4">
                                {search || categoryFilter !== 'all' ? 'Try adjusting your filters' : 'Start by adding your first equipment item'}
                            </p>
                            {!search && categoryFilter === 'all' && (
                                <Button size="sm" icon={<Plus size={13} />} onClick={() => setAddModal(true)}>
                                    Add Equipment
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filtered.map((item) => <EquipmentCard key={item.id} item={item} />)}
                        </div>
                    )}
                </>
            )}

            {tab === 'calendar' && (
                <Card>
                    <CardHeader title="Availability Calendar" />
                    <CardBody>
                        <div className="py-8 text-center">
                            <p className="text-ink3 text-[13px]">Equipment availability timeline coming soon</p>
                            <p className="text-ink4 text-[12px] mt-1">Shows bookings across equipment items by date</p>
                        </div>
                    </CardBody>
                </Card>
            )}

            {tab === 'subrentals' && (
                <Card>
                    <CardHeader title="Sub-Rentals" />
                    <CardBody>
                        <div className="py-8 text-center text-ink4 text-[13px]">
                            Sub-rental tracking coming in Phase 2
                        </div>
                    </CardBody>
                </Card>
            )}

            {tab === 'maintenance' && (
                <Card>
                    <CardHeader title="Maintenance Log" />
                    <CardBody>
                        {items.filter((i) => i.condition === 'repair').length === 0 ? (
                            <div className="py-8 text-center text-ink4 text-[13px]">
                                No items currently in repair
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {items.filter((i) => i.condition === 'repair').map((item) => (
                                    <div key={item.id} className="py-3 flex items-center gap-3">
                                        <span className="text-[20px]">{item.icon}</span>
                                        <div className="flex-1">
                                            <div className="text-[13px] font-medium text-ink">{item.name}</div>
                                            <div className="text-[11px] text-ink4 capitalize">{item.category}</div>
                                        </div>
                                        <Badge variant="red">In Repair</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            <Modal
                open={addModal}
                onClose={() => setAddModal(false)}
                title="Add Equipment"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" size="sm" onClick={() => setAddModal(false)}>Cancel</Button>
                        <Button variant="primary" size="sm" type="submit" form="add-equipment-form">Add Equipment</Button>
                    </>
                }
            >
                <AddEquipmentModal onClose={() => setAddModal(false)} />
            </Modal>
        </div>
    )
}
