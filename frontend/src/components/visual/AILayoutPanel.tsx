import { useState, useMemo, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Wand2, RefreshCw, LayoutTemplate, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { GenerateLayoutParams } from '@/types/layout'

interface AILayoutPanelProps {
    onGenerateDescription: (params: GenerateLayoutParams) => Promise<void>
    onGenerateTemplate: (templateName: string, params: GenerateLayoutParams) => Promise<void>
    isGenerating: boolean
    venueWidth: number
    onVenueWidthChange: (w: number) => void
    venueDepth: number
    onVenueDepthChange: (d: number) => void
    canvasWidth: number
    canvasHeight: number
    scale: number
    preselectedTemplate?: string
    /** Error message from parent — shown as non-blocking UI below button */
    errorMessage?: string
    /** Whether the last generation was successful */
    lastGenerationSuccess?: boolean
}

const TEMPLATES = [
    'Festival Main Stage',
    'Corporate Gala',
    'Conference',
    'Awards Ceremony',
    'Community Event',
    'Product Launch'
]

export default function AILayoutPanel({
    onGenerateDescription,
    onGenerateTemplate,
    isGenerating,
    venueWidth,
    onVenueWidthChange,
    venueDepth,
    onVenueDepthChange,
    canvasWidth,
    canvasHeight,
    scale,
    preselectedTemplate,
    errorMessage,
    lastGenerationSuccess
}: AILayoutPanelProps) {
    const [pax, setPax] = useState<number>(500)
    const [eventType, setEventType] = useState('Festival')
    const [city, setCity] = useState('Cape Town')
    const [description, setDescription] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState<string>('')
    const [activeTab, setActiveTab] = useState('describe')

    // Local error/success state for auto-dismiss
    const [localError, setLocalError] = useState<string | null>(null)
    const [showSuccess, setShowSuccess] = useState(false)

    useEffect(() => {
        if (preselectedTemplate) {
            setSelectedTemplate(preselectedTemplate)
            setActiveTab('template')
        }
    }, [preselectedTemplate])

    // Show error from parent and auto-dismiss after 5s
    useEffect(() => {
        if (errorMessage) {
            setLocalError(errorMessage)
            const timer = setTimeout(() => setLocalError(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [errorMessage])

    // Show success feedback and auto-dismiss after 2.5s
    useEffect(() => {
        if (lastGenerationSuccess) {
            setShowSuccess(true)
            const timer = setTimeout(() => setShowSuccess(false), 2500)
            return () => clearTimeout(timer)
        }
    }, [lastGenerationSuccess])

    const tabs = [
        { key: 'describe', label: 'Describe Event' },
        { key: 'template', label: 'Use Template' }
    ]

    // Rule-based suggestion string
    const suggestionBanner = useMemo(() => {
        if (pax > 1000 && venueWidth < 30) {
            return `For ${pax} pax in a narrow ${venueWidth}m venue, place the stage at the far end facing the long edge to safely handle crowd flow.`
        }
        if (pax < 200 && venueWidth > 50) {
            return `For a small crowd of ${pax} in a wide ${venueWidth}m venue, consider using trussing or screens to reduce the perceived room size and create intimacy.`
        }
        if (eventType === 'Corporate Gala' && venueDepth < 20) {
            return `A shallow ${venueDepth}m room may struggle to fit round tables. Consider long banquet tables or theatre-style seating if possible.`
        }
        return `Position the stage centrally along the ${venueWidth > venueDepth ? 'long' : 'short'} wall to maximize sightlines.`
    }, [pax, venueWidth, venueDepth, eventType])

    const handleGenerate = () => {
        setLocalError(null)
        setShowSuccess(false)

        const params: GenerateLayoutParams = {
            venueWidth,
            venueDepth,
            pax,
            eventType,
            city,
            canvasWidth,
            canvasHeight,
            scale
        }

        if (activeTab === 'describe') {
            onGenerateDescription({ ...params, description })
        } else {
            if (!selectedTemplate) return
            onGenerateTemplate(selectedTemplate, params)
        }
    }

    return (
        <Card>
            <CardHeader title="AI Layout Generator" action={<Wand2 size={16} className="text-amber-500" />} />
            <CardBody>
                <div className={`space-y-4 transition-opacity ${isGenerating ? 'opacity-60' : ''}`}
                    style={isGenerating ? { animation: 'ai-pulse 1.2s ease-in-out infinite' } : undefined}>
                    {/* Common Options */}
                    <div className="grid grid-cols-2 gap-3 text-[12px]">
                        <div>
                            <label className="block text-ink3 mb-1 font-medium">Width (m)</label>
                            <input
                                type="number"
                                value={venueWidth}
                                onChange={e => onVenueWidthChange(Number(e.target.value))}
                                className="w-full border border-border rounded-sm p-1.5 bg-surface focus:outline-none focus:border-brand"
                            />
                        </div>
                        <div>
                            <label className="block text-ink3 mb-1 font-medium">Depth (m)</label>
                            <input
                                type="number"
                                value={venueDepth}
                                onChange={e => onVenueDepthChange(Number(e.target.value))}
                                className="w-full border border-border rounded-sm p-1.5 bg-surface focus:outline-none focus:border-brand"
                            />
                        </div>
                        <div>
                            <label className="block text-ink3 mb-1 font-medium">Pax</label>
                            <input
                                type="number"
                                value={pax}
                                onChange={e => setPax(Number(e.target.value))}
                                className="w-full border border-border rounded-sm p-1.5 bg-surface focus:outline-none focus:border-brand"
                            />
                        </div>
                        <div>
                            <label className="block text-ink3 mb-1 font-medium">City</label>
                            <input
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                className="w-full border border-border rounded-sm p-1.5 bg-surface focus:outline-none focus:border-brand"
                                placeholder="e.g. Cape Town"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 flex gap-3 text-[12px] text-blue-400">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold block mb-1">Staging Suggestion</span>
                            {suggestionBanner}
                        </div>
                    </div>

                    <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

                    {activeTab === 'describe' && (
                        <div>
                            <label className="block text-ink3 text-[12px] mb-1 font-medium">Event Description</label>
                            <textarea
                                placeholder="e.g. Outdoor concert, 1200 pax, main stage + 2 side screens, FOH position centre, GA standing..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full h-24 border border-border rounded-sm p-2 bg-surface text-[12px] placeholder:text-ink4 focus:outline-none focus:border-brand resize-none"
                            />
                        </div>
                    )}

                    {activeTab === 'template' && (
                        <div>
                            <label className="block text-ink3 text-[12px] mb-1 font-medium">Select a Template</label>
                            <select
                                value={selectedTemplate}
                                onChange={e => setSelectedTemplate(e.target.value)}
                                className="w-full border border-border rounded-sm p-2 bg-surface text-[12px] focus:outline-none focus:border-brand"
                            >
                                <option value="" disabled>Choose base layout...</option>
                                {TEMPLATES.map(temp => (
                                    <option key={temp} value={temp}>{temp}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || (activeTab === 'describe' ? !description.trim() : !selectedTemplate)}
                        className="w-full justify-center !bg-amber-600 hover:!bg-amber-700 !text-white border-0 py-2.5 h-auto text-[13px]"
                        icon={isGenerating ? <RefreshCw size={14} className="animate-spin" /> : showSuccess ? <CheckCircle2 size={14} /> : <LayoutTemplate size={14} />}
                    >
                        {isGenerating ? 'Generating Layout...' : showSuccess ? '✅ Layout Generated!' : 'Generate Auto-Layout'}
                    </Button>

                    {/* Non-blocking error message — auto-dismisses after 5s */}
                    {localError && (
                        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-md p-2.5 text-[11px] text-red-500 animate-in fade-in">
                            <XCircle size={14} className="shrink-0 mt-0.5" />
                            <span>{localError}</span>
                        </div>
                    )}

                    {/* Non-blocking success message */}
                    {showSuccess && !localError && (
                        <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-md p-2.5 text-[11px] text-green-600">
                            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                            <span>Layout generated and applied to canvas! Use Undo to revert.</span>
                        </div>
                    )}
                </div>
            </CardBody>

            {/* Pulse animation CSS */}
            <style>{`
                @keyframes ai-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `}</style>
        </Card>
    )
}
