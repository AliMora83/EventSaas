import React, { useState } from 'react'
import { FileText, Send, CheckCircle, Plus, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useEvents } from '@/hooks/useEvents'
import { useProposals } from '@/hooks/useProposals'
import { useAppStore } from '@/store/useAppStore'
import { Proposal } from '@/types/proposal'

const proposalStatusBadge: Record<string, any> = {
    draft: 'neutral', sent: 'blue', approved: 'green', rejected: 'red',
}

export function Proposals() {
    const [tab, setTab] = useState('all')
    const [previewModal, setPreviewModal] = useState(false)
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
    const { events, loading: eventsLoading } = useEvents()
    const { selectedEventId, setSelectedEvent } = useAppStore()
    const eventId = selectedEventId || events[0]?.id || ''
    const { proposals, loading, createProposal } = useProposals(eventId)
    const currentEvent = events.find((e) => e.id === eventId)

    const tabs = [
        { key: 'all', label: 'All Proposals', count: proposals.length },
        { key: 'signoff', label: 'Sign-off Queue', count: proposals.filter((p) => p.status === 'sent').length },
        { key: 'portals', label: 'Client Portals' },
        { key: 'templates', label: 'Templates' },
    ]

    const handleCreate = () => {
        if (!eventId) return
        createProposal.mutate({
            version: (proposals.length || 0) + 1,
            status: 'draft',
            sections: {
                overview: { status: 'pending' },
                technical: { status: 'pending' },
                budget: { status: 'pending' },
                floorPlan: { status: 'pending' },
            },
            notes: '',
        })
    }

    return (
        <div className="space-y-4">
            {/* Event selector */}
            {events.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    {events.map((e) => (
                        <button key={e.id} onClick={() => setSelectedEvent(e.id)}
                            className={`px-3 py-1.5 rounded-sm text-[12px] font-semibold border transition-all cursor-pointer ${e.id === eventId ? 'bg-brand text-white border-brand' : 'bg-surface text-ink2 border-border hover:border-brand hover:text-brand'
                                }`}
                        >
                            {e.name}
                        </button>
                    ))}
                </div>
            )}

            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {tab === 'all' && (
                <Card>
                    <CardHeader
                        title="All Proposals"
                        action={<Button size="sm" icon={<Plus size={13} />} onClick={handleCreate} disabled={!eventId}>New Proposal</Button>}
                    />
                    {loading ? (
                        <CardBody>
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-12 w-full rounded" />)}
                            </div>
                        </CardBody>
                    ) : proposals.length === 0 ? (
                        <CardBody>
                            <div className="py-12 text-center">
                                <FileText size={32} className="text-ink4 mx-auto mb-3" />
                                <p className="text-ink3 text-[13px] font-medium mb-1">No proposals yet</p>
                                <p className="text-ink4 text-[12px] mb-4">Create a proposal to send to your client for digital sign-off</p>
                                <Button size="sm" icon={<Plus size={13} />} onClick={handleCreate} disabled={!eventId}>
                                    Create Proposal
                                </Button>
                            </div>
                        </CardBody>
                    ) : (
                        <div className="divide-y divide-border">
                            {proposals.map((proposal) => (
                                <div key={proposal.id} className="px-[18px] py-4 flex items-center gap-4 hover:bg-surface2 transition-colors">
                                    <FileText size={16} className="text-ink4 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13px] font-semibold text-ink">
                                            {currentEvent?.name} — Proposal v{proposal.version}
                                        </div>
                                        <div className="text-[11px] text-ink4">
                                            {proposal.sentAt
                                                ? `Sent ${format(new Date(proposal.sentAt.seconds * 1000), 'dd MMM yyyy')}`
                                                : 'Not sent yet'
                                            }
                                        </div>
                                    </div>
                                    {/* Section approvals */}
                                    <div className="flex items-center gap-1">
                                        {Object.entries(proposal.sections).map(([key, section]) => (
                                            <div
                                                key={key}
                                                className={`w-2 h-2 rounded-full ${section.status === 'approved' ? 'bg-green' : 'bg-border2'}`}
                                                title={`${key}: ${section.status}`}
                                            />
                                        ))}
                                    </div>
                                    <Badge variant={proposalStatusBadge[proposal.status]}>{proposal.status}</Badge>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="secondary" icon={<Eye size={12} />} onClick={() => { setSelectedProposal(proposal); setPreviewModal(true) }}>
                                            Preview
                                        </Button>
                                        {proposal.status === 'draft' && (
                                            <Button size="sm" icon={<Send size={12} />}>Send</Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {tab === 'signoff' && (
                <Card>
                    <CardHeader title="Sign-off Queue" />
                    <CardBody>
                        {proposals.filter((p) => p.status === 'sent').length === 0 ? (
                            <div className="py-10 text-center text-ink4 text-[13px]">
                                No proposals awaiting client sign-off
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {proposals.filter((p) => p.status === 'sent').map((proposal) => (
                                    <div key={proposal.id} className="border border-border rounded-sm p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[13px] font-semibold">{currentEvent?.name} — v{proposal.version}</span>
                                            <Badge variant="blue">Awaiting sign-off</Badge>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {Object.entries(proposal.sections).map(([key, section]) => (
                                                <div key={key} className={`p-2 rounded-sm text-center text-[11px] font-medium ${section.status === 'approved' ? 'bg-green-light text-green' : 'bg-bg2 text-ink4'
                                                    }`}>
                                                    {section.status === 'approved' ? '✓' : '○'} {key}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {tab === 'portals' && (
                <Card>
                    <CardHeader title="Client Portals" />
                    <CardBody>
                        <div className="py-8 text-center text-ink4 text-[13px]">
                            <p>Client portal links appear here when proposals are sent.</p>
                            <p className="mt-1">URL format: eventsaas.namka.cloud/portal/namka/{'{eventId}/{token}'}</p>
                        </div>
                    </CardBody>
                </Card>
            )}

            {tab === 'templates' && (
                <Card>
                    <CardHeader title="Proposal Templates" />
                    <CardBody>
                        <div className="py-8 text-center text-ink4 text-[13px]">Templates coming in Phase 2</div>
                    </CardBody>
                </Card>
            )}

            {/* Preview modal */}
            <Modal
                open={previewModal}
                onClose={() => setPreviewModal(false)}
                title="Proposal Preview"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" size="sm" onClick={() => setPreviewModal(false)}>Close</Button>
                        <Button variant="primary" size="sm" icon={<Send size={12} />}>Send to Client</Button>
                    </>
                }
            >
                {selectedProposal && currentEvent && (
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="bg-ink text-white rounded-sm p-6">
                            <div className="text-[11px] uppercase tracking-widest text-ink4 mb-1">Event Production Proposal</div>
                            <h2 className="font-serif text-[22px] italic font-semibold">{currentEvent.name}</h2>
                            <div className="text-[13px] text-ink4 mt-2">{currentEvent.venue} · {currentEvent.city}</div>
                            <div className="text-[13px] text-ink4">
                                {currentEvent.date ? format(new Date(currentEvent.date.seconds * 1000), 'dd MMMM yyyy') : '—'}
                                {' · '}{currentEvent.expectedPax?.toLocaleString()} pax
                            </div>
                        </div>
                        {/* Sections */}
                        {Object.entries(selectedProposal.sections).map(([key, section]) => (
                            <div key={key} className={`border rounded-sm p-4 ${section.status === 'approved' ? 'border-green bg-green-light' : 'border-border'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-[13px] font-semibold capitalize text-ink">{key} Section</span>
                                    <Badge variant={section.status === 'approved' ? 'green' : 'neutral'}>{section.status}</Badge>
                                </div>
                                {section.status === 'approved' && section.approvedAt && (
                                    <p className="text-[11px] text-green mt-1">
                                        Approved {format(new Date(section.approvedAt.seconds * 1000), 'dd MMM yyyy HH:mm')}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    )
}
