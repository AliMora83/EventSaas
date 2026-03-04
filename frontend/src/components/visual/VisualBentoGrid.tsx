import React, { useEffect, useState } from 'react'
import { Layers, Grid, Download, Save, Clock } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { db } from '@/firebase'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { Layout } from '@/types/layout'

interface VisualBentoGridProps {
    onTemplateSelect: (templateName: string) => void
    onExportPDF: () => void
    onExportPNG: () => void
    onLoadLayout: (layout: Layout) => void
}

export default function VisualBentoGrid({
    onTemplateSelect,
    onExportPDF,
    onExportPNG,
    onLoadLayout
}: VisualBentoGridProps) {
    const [savedLayouts, setSavedLayouts] = useState<Layout[]>([])
    const [loadingLayouts, setLoadingLayouts] = useState(true)

    const templates = [
        'Festival Main Stage',
        'Corporate Gala',
        'Conference',
        'Awards Ceremony',
        'Community Event',
        'Product Launch'
    ]

    useEffect(() => {
        const fetchLayouts = async () => {
            try {
                // Fetch recent 3 layouts
                const layoutsRef = collection(db, 'organisations', 'default-org', 'layouts')
                const q = query(layoutsRef, orderBy('createdAt', 'desc'), limit(3))
                const snapshot = await getDocs(q)

                const fetched = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Layout[]
                setSavedLayouts(fetched)
            } catch (error) {
                console.error('Error fetching layouts:', error)
            } finally {
                setLoadingLayouts(false)
            }
        }
        fetchLayouts()
    }, [])

    return (
        <div className="grid grid-cols-2 gap-4 mt-6">
            {/* Card 1: 3D Stage View */}
            <div className="bg-white border border-[#e2ddd8] rounded-[10px] min-h-[180px] p-5 flex flex-col justify-between hover:shadow-sm transition-all relative overflow-hidden">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Layers size={16} className="text-ink3" />
                        <h3 className="font-bold text-[13px] text-inkPlus uppercase tracking-wide">3D Stage View</h3>
                    </div>
                    <p className="text-[12px] text-ink4 mt-1 leading-relaxed max-w-[80%]">
                        Preview your layout in full 3D. Inspect sightlines, camera angles, and structural fits.
                    </p>
                </div>
                <div>
                    <span className="inline-flex items-center px-2 py-1 bg-surface2 text-ink4 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        Coming in Phase 3
                    </span>
                </div>
                {/* Decorative background icon */}
                <Layers size={120} className="absolute -right-4 -bottom-4 text-surface2/50 outline-none" strokeWidth={1} />
            </div>

            {/* Card 2: Venue Templates */}
            <div className="bg-white border border-[#e2ddd8] rounded-[10px] min-h-[180px] p-5 flex flex-col justify-between hover:shadow-sm transition-all">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Grid size={16} className="text-ink3" />
                        <h3 className="font-bold text-[13px] text-inkPlus uppercase tracking-wide">Venue Templates</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {templates.map(t => (
                            <button
                                key={t}
                                onClick={() => onTemplateSelect(t)}
                                className="px-3 py-1.5 bg-surface border border-border hover:border-brand hover:text-brand transition-colors text-[11px] rounded-full text-ink3 whitespace-nowrap"
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <span className="text-[11px] text-brand font-medium hover:underline cursor-pointer">
                        Browse all templates →
                    </span>
                </div>
            </div>

            {/* Card 3: Import / Export */}
            <div className="bg-white border border-[#e2ddd8] rounded-[10px] min-h-[180px] p-5 flex flex-col justify-between hover:shadow-sm transition-all">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Download size={16} className="text-ink3" />
                            <h3 className="font-bold text-[13px] text-inkPlus uppercase tracking-wide">Import / Export</h3>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full justify-center bg-surface hover:bg-surface2"
                            icon={<Download size={14} />}
                            onClick={onExportPDF}
                        >
                            Export PDF
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full justify-center bg-surface hover:bg-surface2"
                            icon={<Download size={14} />}
                            onClick={onExportPNG}
                        >
                            Export PNG
                        </Button>
                    </div>
                    <p className="text-[11px] text-ink4 mt-3 text-center bg-surface py-2 px-3 border border-border border-dashed rounded-sm">
                        Vectorworks DWG import coming in Phase 3
                    </p>
                </div>
            </div>

            {/* Card 4: Saved Layouts */}
            <div className="bg-white border border-[#e2ddd8] rounded-[10px] min-h-[180px] p-5 flex flex-col justify-between hover:shadow-sm transition-all">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Save size={16} className="text-ink3" />
                        <h3 className="font-bold text-[13px] text-inkPlus uppercase tracking-wide">Saved Layouts</h3>
                    </div>

                    {loadingLayouts ? (
                        <div className="flex items-center justify-center p-4">
                            <span className="text-[11px] text-ink4">Loading...</span>
                        </div>
                    ) : savedLayouts.length === 0 ? (
                        <div className="text-[12px] text-ink4 bg-surface p-3 rounded-md text-center">
                            No saved layouts found for this event.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-[11px] text-ink4 mb-2">
                                {savedLayouts.length} layouts saved recently
                            </div>
                            {savedLayouts.map(layout => (
                                <div
                                    key={layout.id}
                                    className="flex items-center justify-between p-2 rounded-md hover:bg-surface border border-transparent hover:border-border cursor-pointer transition-all group"
                                    onClick={() => {
                                        if (window.confirm(`Load "${layout.name}"? This will replace your current canvas.`)) {
                                            onLoadLayout(layout)
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} className="text-ink4" />
                                        <span className="text-[12px] font-medium text-ink truncate max-w-[150px]">
                                            {layout.name}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                                        Load
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="mt-4 flex justify-end">
                    <span className="text-[11px] text-brand font-medium hover:underline cursor-pointer">
                        View All Layouts →
                    </span>
                </div>
            </div>
        </div>
    )
}
