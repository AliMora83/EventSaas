import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Grid, Move, Square, Minus, Monitor, Volume2, Fence, Layers, Save, Download, Wand2, Users, Zap, Droplet, DoorOpen, Undo2 } from 'lucide-react'
import { useLayoutStore } from '@/store/layoutStore'
import { generateLayoutFromDescription, generateLayoutFromTemplate, saveLayout } from '@/services/layoutService'
import { ElementType, GenerateLayoutParams } from '@/types/layout'
import { useAuthStore } from '@/store/useAuthStore'
import AILayoutPanel from '@/components/visual/AILayoutPanel'
import AILayoutSummary from '@/components/visual/AILayoutSummary'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const toolConfig: Record<ElementType, { label: string; defaultSize: [number, number]; fill: string; stroke: string; icon: React.ReactNode }> = {
    select: { label: 'Select', defaultSize: [100, 100], fill: 'transparent', stroke: '#c2410c', icon: <Move size={14} /> },
    stage: { label: 'Stage', defaultSize: [100, 50], fill: '#fed7aa', stroke: '#c2410c', icon: <Square size={14} /> },
    truss: { label: 'Truss', defaultSize: [400, 25], fill: '#e0e7ff', stroke: '#4f46e5', icon: <Minus size={14} /> },
    screen: { label: 'Screen', defaultSize: [100, 60], fill: '#dcfce7', stroke: '#16a34a', icon: <Monitor size={14} /> },
    speaker: { label: 'Speaker', defaultSize: [40, 60], fill: '#fef9c3', stroke: '#ca8a04', icon: <Volume2 size={14} /> },
    barrier: { label: 'Barrier', defaultSize: [360, 20], fill: '#f1f5f9', stroke: '#64748b', icon: <Fence size={14} /> },
    table: { label: 'Table', defaultSize: [70, 40], fill: '#fce7f3', stroke: '#be185d', icon: <Square size={14} /> },
    foh: { label: 'FOH', defaultSize: [160, 60], fill: '#cbd5e1', stroke: '#334155', icon: <Users size={14} /> },
    generator: { label: 'Generator', defaultSize: [80, 80], fill: '#fef08a', stroke: '#a16207', icon: <Zap size={14} /> },
    toilet: { label: 'Toilet', defaultSize: [40, 40], fill: '#bfdbfe', stroke: '#1d4ed8', icon: <Droplet size={14} /> },
    entrance: { label: 'Entrance', defaultSize: [60, 20], fill: '#bbf7d0', stroke: '#15803d', icon: <DoorOpen size={14} /> },
}

export function Visual() {
    const [tab, setTab] = useState('2d')
    const [activeTool, setActiveTool] = useState<ElementType>('select')
    const orgId = useAuthStore(s => s.orgId) || import.meta.env.VITE_ORG_ID || 'namka-events'
    const { elements, addElement, deleteElement, clearCanvas, selectElement, updateElement, selectedId, applyAILayout, undoAILayout, previousElements, lastAIResult } = useLayoutStore()

    // AI Panel State
    const [venueWidth, setVenueWidth] = useState(60)
    const [venueDepth, setVenueDepth] = useState(40)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [aiError, setAiError] = useState<string | null>(null)
    const [aiSuccessCounter, setAiSuccessCounter] = useState(0)

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [dragging, setDragging] = useState<string | null>(null)
    const [dragStartSnapshot, setDragStartSnapshot] = useState<any[] | null>(null)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [isHoveringElement, setIsHoveringElement] = useState(false)
    const [preselectedTemplate, setPreselectedTemplate] = useState<string | undefined>()
    const [saveError, setSaveError] = useState<string | null>(null)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Local undo history — snapshots of elements array
    const [undoHistory, setUndoHistory] = useState<any[][]>([])

    const GRID = 10  // 10px = 1m at scale 1:100

    const pushUndo = useCallback((snapshot: any[]) => {
        setUndoHistory(prev => [...prev.slice(-30), snapshot])  // keep last 30 states
    }, [])

    const handleUndo = useCallback(() => {
        setUndoHistory(prev => {
            if (prev.length === 0) return prev
            const last = prev[prev.length - 1]
            // Restore via store — clear then re-add each element
            clearCanvas()
            last.forEach((el: any) => addElement(el))
            return prev.slice(0, -1)
        })
    }, [clearCanvas, addElement])

    // Draw canvas
    const draw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Background
        ctx.fillStyle = '#f0ede8'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Grid
        ctx.strokeStyle = '#ddd6d0'
        ctx.lineWidth = 0.5
        for (let x = 0; x <= canvas.width; x += GRID) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
        }
        for (let y = 0; y <= canvas.height; y += GRID) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
        }

        // Scale indicator
        ctx.fillStyle = '#a8a29e'
        ctx.font = '10px Plus Jakarta Sans'
        ctx.fillText('Scale 1:100 · Grid = 1m', 8, canvas.height - 10)

        // Elements
        elements.forEach((el) => {
            ctx.fillStyle = el.color
            ctx.strokeStyle = el.id === selectedId ? '#ea580c' : el.strokeColor // Brand orange highlight
            ctx.lineWidth = el.id === selectedId ? 2 : 1.5
            const r = 5
            ctx.beginPath()
            ctx.roundRect(el.x, el.y, el.width, el.height, r)
            ctx.fill()
            ctx.stroke()
            ctx.fillStyle = el.id === selectedId ? '#ea580c' : el.strokeColor
            ctx.font = 'bold 11px Plus Jakarta Sans'
            ctx.fillText(el.label, el.x + 8, el.y + 16)
        })
    }, [elements, selectedId])

    useEffect(() => { draw() }, [draw])

    // Keyboard delete, escape & undo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setActiveTool('select')
                selectElement(null)
            }
            if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId) {
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
                pushUndo([...elements])
                deleteElement(selectedId)
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault()
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
                handleUndo()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedId, deleteElement, selectElement, handleUndo, pushUndo, elements])

    const snapToGrid = (v: number) => Math.round(v / GRID) * GRID

    // Mouse interactions
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        if (activeTool === 'select') {
            const clickedEl = [...elements].reverse().find(
                (el) => x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height
            )
            if (clickedEl) {
                selectElement(clickedEl.id)
                setDragging(clickedEl.id)
                setOffset({ x: x - clickedEl.x, y: y - clickedEl.y })
                // Snapshot before drag starts so we can undo the move
                setDragStartSnapshot([...elements])
            } else {
                selectElement(null)
            }
        } else {
            // Placement mode — snapshot before placing
            pushUndo([...elements])
            const snapX = snapToGrid(x)
            const snapY = snapToGrid(y)
            const config = toolConfig[activeTool]
            const [w, h] = config.defaultSize
            const newEl = {
                id: Math.random().toString(36).slice(2),
                type: activeTool,
                label: config.label,
                x: snapX, y: snapY, width: w, height: h,
                color: config.fill,
                strokeColor: config.stroke,
            }
            addElement(newEl as any)
            selectElement(newEl.id)
        }
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        if (dragging && activeTool === 'select') {
            updateElement(dragging, {
                x: snapToGrid(x - offset.x),
                y: snapToGrid(y - offset.y)
            })
        } else if (activeTool === 'select') {
            // Detect hover over any element to show grab cursor
            const hovering = elements.some(
                (el) => x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height
            )
            setIsHoveringElement(hovering)
        }
    }

    const handleMouseUp = () => {
        // If we were dragging, commit the pre-drag snapshot to undo history
        if (dragging && dragStartSnapshot) {
            pushUndo(dragStartSnapshot)
            setDragStartSnapshot(null)
        }
        setDragging(null)
    }

    const handleMouseLeave = () => {
        if (dragging && dragStartSnapshot) {
            pushUndo(dragStartSnapshot)
            setDragStartSnapshot(null)
        }
        setDragging(null)
        setIsHoveringElement(false)
    }

    const handleClearCanvas = () => {
        if (elements.length === 0) return
        if (window.confirm('Clear the canvas? This cannot be undone.')) {
            pushUndo([...elements])
            clearCanvas()
        }
    }

    const handleExportPDF = async () => {
        if (!canvasRef.current) return
        try {
            const canvas = await html2canvas(canvasRef.current)
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('l', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
            pdf.save('layout-export.pdf')
        } catch (error) {
            console.error("PDF export failed", error)
            alert("Failed to export PDF")
        }
    }

    const handleExportPNG = () => {
        if (!canvasRef.current) return
        const dataUrl = canvasRef.current.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = 'layout-export.png'
        link.href = dataUrl
        link.click()
    }

    const handleGenerateDescription = async (params: GenerateLayoutParams) => {
        // Confirm replace if canvas already has elements
        if (elements.length > 0) {
            const replace = window.confirm(
                `Replace current layout (${elements.length} element${elements.length > 1 ? 's' : ''}) with AI-generated layout?`
            )
            if (!replace) return
        }

        setIsGenerating(true)
        setAiError(null)
        try {
            const result = await generateLayoutFromDescription(params)
            applyAILayout(result, toolConfig)
            setAiSuccessCounter(c => c + 1)
        } catch (error) {
            console.error(error)
            setAiError(error instanceof Error ? error.message : 'Failed to generate layout')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleGenerateTemplate = async (templateName: string, params: GenerateLayoutParams) => {
        // Confirm replace if canvas already has elements
        if (elements.length > 0) {
            const replace = window.confirm(
                `Replace current layout (${elements.length} element${elements.length > 1 ? 's' : ''}) with AI-generated layout?`
            )
            if (!replace) return
        }

        setIsGenerating(true)
        setAiError(null)
        try {
            const result = await generateLayoutFromTemplate(templateName, params)
            applyAILayout(result, toolConfig)
            setAiSuccessCounter(c => c + 1)
        } catch (error) {
            console.error(error)
            setAiError(error instanceof Error ? error.message : 'Failed to generate layout')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSaveLayout = async () => {
        if (elements.length === 0) {
            setSaveError('Nothing to save — add some elements first.')
            setTimeout(() => setSaveError(null), 4000)
            return
        }
        setIsSaving(true)
        setSaveError(null)
        setSaveSuccess(false)
        try {
            const layoutName = lastAIResult?.layoutName || 'My Layout'
            await saveLayout(orgId, layoutName, elements, lastAIResult ?? undefined)
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
        } catch (error) {
            console.error('Save layout error:', error)
            setSaveError(error instanceof Error ? error.message : 'Failed to save layout — check Firestore connection.')
            setTimeout(() => setSaveError(null), 6000)
        } finally {
            setIsSaving(false)
        }
    }

    const tabs = [
        { key: '2d', label: '2D Floor Plan' },
        { key: '3d', label: '3D Stage View' },
        { key: 'templates', label: 'Venue Templates' },
        { key: 'import', label: 'Import / Export' },
    ]

    return (
        <div className="space-y-4">
            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {tab === '2d' && (
                <div className="space-y-4">
                    <div className="flex gap-4 items-stretch">
                        {/* ── Toolbar ── */}
                        <div className="w-[52px] flex-shrink-0">
                            <div className="bg-surface border border-border rounded-[10px] shadow-sm p-2 space-y-1">
                                {(Object.keys(toolConfig) as ElementType[]).map((tool) => (
                                    <button
                                        key={tool}
                                        onClick={() => setActiveTool(tool)}
                                        className={`w-full h-9 flex items-center justify-center rounded-sm transition-all cursor-pointer ${activeTool === tool ? 'bg-brand text-white' : 'text-ink3 hover:bg-bg2 hover:text-ink'
                                            }`}
                                        title={toolConfig[tool].label}
                                    >
                                        {toolConfig[tool].icon}
                                    </button>
                                ))}
                                <div className="border-t border-border my-1" />
                                <button
                                    onClick={handleClearCanvas}
                                    className="w-full h-9 flex items-center justify-center rounded-sm text-ink4 hover:bg-red-light hover:text-red transition-all cursor-pointer text-[10px] font-bold"
                                    title="Clear canvas"
                                >
                                    CLR
                                </button>
                            </div>
                        </div>

                        {/* ── Left column: Canvas + AI Summary below ── */}
                        <div className="flex-1 flex flex-col gap-3">
                            <Card>
                                <CardHeader
                                    title="2D Floor Plan"
                                    action={
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                icon={<Undo2 size={12} />}
                                                onClick={handleUndo}
                                                disabled={undoHistory.length === 0}
                                                title="Undo last action (Ctrl+Z)"
                                            >
                                                Undo
                                            </Button>
                                            <Button size="sm" variant="secondary" icon={<Download size={12} />} onClick={handleExportPDF}>Export PDF</Button>
                                            <Button
                                                size="sm"
                                                icon={<Save size={12} />}
                                                onClick={handleSaveLayout}
                                                loading={isSaving}
                                                className={saveSuccess ? '!bg-emerald-600 border-emerald-600' : ''}
                                            >
                                                {saveSuccess ? 'Saved!' : 'Save Layout'}
                                            </Button>
                                        </div>
                                    }
                                />
                                <div className="p-4">
                                    <canvas
                                        ref={canvasRef}
                                        width={800}
                                        height={480}
                                        onMouseDown={handleMouseDown}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseLeave}
                                        className="w-full rounded-sm border border-border"
                                        style={{
                                            cursor: activeTool !== 'select'
                                                ? 'crosshair'
                                                : dragging
                                                    ? 'grabbing'
                                                    : isHoveringElement
                                                        ? 'grab'
                                                        : 'default'
                                        }}
                                    />
                                </div>
                                {/* Inline save error — no alert() */}
                                {saveError && (
                                    <div className="mx-4 mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-md text-[11px] text-red-500 flex items-center gap-2">
                                        <span className="font-bold">Save failed:</span> {saveError}
                                    </div>
                                )}
                            </Card>

                            {/* AI undo banner */}
                            {lastAIResult && previousElements.length > 0 && (
                                <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-2 rounded-md">
                                    <span className="text-[12px] text-amber-500">AI Layout generated. Not happy?</span>
                                    <Button size="sm" variant="secondary" onClick={undoAILayout}>Undo AI changes</Button>
                                </div>
                            )}

                            <AILayoutSummary
                                result={lastAIResult}
                                onSaveLayout={handleSaveLayout}
                                isSaving={isSaving}
                            />
                        </div>

                        {/* ── Right column: Elements at top, AI Panel below ── */}
                        <div className="w-[380px] flex-shrink-0 flex flex-col gap-3">
                            {/* Selected element inspector — at top when visible */}
                            {selectedId && (
                                <Card>
                                    <CardHeader title="Selected Element" />
                                    <CardBody>
                                        {(() => {
                                            const el = elements.find(e => e.id === selectedId)
                                            if (!el) return null
                                            return (
                                                <div className="space-y-2 text-[12px]">
                                                    <div className="flex justify-between">
                                                        <span className="text-ink4">Type:</span>
                                                        <span className="font-semibold text-ink">{el.label}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-ink4">Size:</span>
                                                        <span className="font-semibold text-ink">{el.width / GRID}m × {el.height / GRID}m</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-ink4">Position:</span>
                                                        <span className="font-semibold text-ink">X: {el.x / GRID}m, Y: {el.y / GRID}m</span>
                                                    </div>
                                                    <Button size="sm" variant="secondary" className="w-full mt-2 !text-red hover:bg-red-light border-red/20" onClick={() => { pushUndo([...elements]); deleteElement(el.id) }}>
                                                        Remove Element
                                                    </Button>
                                                </div>
                                            )
                                        })()}
                                    </CardBody>
                                </Card>
                            )}

                            {/* Elements list — directly below inspector */}
                            <Card>
                                <CardHeader title={`Elements (${elements.length})`} />
                                <div className="max-h-48 overflow-y-auto divide-y divide-border">
                                    {elements.length === 0 ? (
                                        <div className="p-3 text-[11px] text-ink4 text-center">Click canvas to add elements</div>
                                    ) : elements.map((el) => (
                                        <div
                                            key={el.id}
                                            className={`px-3 py-2 flex items-center gap-2 hover:bg-surface2 transition-colors cursor-pointer ${el.id === selectedId ? 'bg-brand-light' : ''}`}
                                            onClick={() => selectElement(el.id)}
                                        >
                                            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: el.strokeColor }} />
                                            <span className="text-[12px] text-ink flex-1 truncate">{el.label}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); pushUndo([...elements]); deleteElement(el.id) }}
                                                className="text-ink4 hover:text-red text-[10px] cursor-pointer"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* AI Layout Panel — scrolls internally, fills remaining height */}
                            <div className="flex-1 overflow-y-auto">
                                <AILayoutPanel
                                    onGenerateDescription={handleGenerateDescription}
                                    onGenerateTemplate={handleGenerateTemplate}
                                    isGenerating={isGenerating}
                                    venueWidth={venueWidth}
                                    onVenueWidthChange={setVenueWidth}
                                    venueDepth={venueDepth}
                                    onVenueDepthChange={setVenueDepth}
                                    canvasWidth={800}
                                    canvasHeight={480}
                                    scale={0.02}
                                    preselectedTemplate={preselectedTemplate}
                                    errorMessage={aiError || undefined}
                                    lastGenerationSuccess={aiSuccessCounter > 0 ? true : undefined}
                                />
                            </div>
                        </div>
                    </div>


                </div>
            )}

            {/* Other tabs are kept in top-nav but their content is mostly surfaced via Bento grid now. */}
            {
                tab === '3d' && (
                    <Card>
                        <CardHeader title="3D Stage View" />
                        <CardBody>
                            <div className="py-16 text-center">
                                <Layers size={36} className="text-ink4 mx-auto mb-3" />
                                <p className="text-ink3 font-medium text-[14px] mb-1">3D Viewer — Phase 3</p>
                                <p className="text-ink4 text-[13px]">Three.js 3D viewer coming in Phase 3. Build your 2D layout first.</p>
                            </div>
                        </CardBody>
                    </Card>
                )
            }

            {
                tab === 'templates' && (
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { name: 'CTICC — Hall 1', size: '80m × 45m' },
                            { name: 'JHB Expo Centre', size: '120m × 80m' },
                            { name: 'Gallagher Estate', size: '60m × 40m' },
                            { name: 'SANLAM Auditorium', size: '40m × 25m' },
                            { name: 'SilverStar Arena', size: '50m × 35m' },
                        ].map((venue) => (
                            <div key={venue.name} className="bg-surface border border-border rounded-[10px] p-4 hover:shadow-md transition-all">
                                <div className="bg-bg2 rounded-sm h-24 mb-3 flex items-center justify-center text-ink4">
                                    <Grid size={20} />
                                </div>
                                <div className="text-[13px] font-semibold text-ink">{venue.name}</div>
                                <div className="text-[11px] text-ink4">{venue.size}</div>
                                <Button size="sm" variant="secondary" className="mt-3 w-full justify-center">Load Template</Button>
                            </div>
                        ))}
                    </div>
                )
            }

            {
                tab === 'import' && (
                    <Card>
                        <CardHeader title="Import / Export" />
                        <CardBody>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-[12px] font-bold text-ink3 uppercase tracking-wide mb-3">Import</h4>
                                    <div className="border-2 border-dashed border-border2 rounded-sm p-8 text-center text-ink4 text-[13px]">
                                        <p>Drag & drop DWG or VWX file</p>
                                        <p className="text-[11px] mt-1">Phase 3 feature</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[12px] font-bold text-ink3 uppercase tracking-wide mb-3">Export</h4>
                                    <div className="space-y-2">
                                        <Button variant="secondary" size="sm" className="w-full justify-center" icon={<Download size={12} />}>Export as PDF</Button>
                                        <Button variant="secondary" size="sm" className="w-full justify-center" icon={<Download size={12} />}>Export as PNG</Button>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )
            }
        </div >
    )
}
