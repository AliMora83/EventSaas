import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Grid, Move, Square, Minus, Monitor, Volume2, Fence, Layers, Save, Download, Wand2 } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type CanvasTool = 'select' | 'stage' | 'truss' | 'screen' | 'speaker' | 'barrier' | 'table'

interface CanvasElement {
    id: string
    type: CanvasTool
    label: string
    x: number
    y: number
    width: number
    height: number
    color: string
    strokeColor: string
}

const toolConfig: Record<CanvasTool, { label: string; defaultSize: [number, number]; fill: string; stroke: string; icon: React.ReactNode }> = {
    select: { label: 'Select', defaultSize: [100, 100], fill: 'transparent', stroke: '#c2410c', icon: <Move size={14} /> },
    stage: { label: 'Stage', defaultSize: [240, 140], fill: '#fed7aa', stroke: '#c2410c', icon: <Square size={14} /> },
    truss: { label: 'Truss', defaultSize: [400, 32], fill: '#e0e7ff', stroke: '#4f46e5', icon: <Minus size={14} /> },
    screen: { label: 'Screen', defaultSize: [120, 160], fill: '#dcfce7', stroke: '#16a34a', icon: <Monitor size={14} /> },
    speaker: { label: 'Speaker', defaultSize: [72, 120], fill: '#fef9c3', stroke: '#ca8a04', icon: <Volume2 size={14} /> },
    barrier: { label: 'Barrier', defaultSize: [360, 24], fill: '#f1f5f9', stroke: '#64748b', icon: <Fence size={14} /> },
    table: { label: 'Table', defaultSize: [100, 100], fill: '#fce7f3', stroke: '#be185d', icon: <Square size={14} /> },
}

export function Visual() {
    const [tab, setTab] = useState('2d')
    const [activeTool, setActiveTool] = useState<CanvasTool>('select')
    const [elements, setElements] = useState<CanvasElement[]>([])
    const [aiPrompt, setAiPrompt] = useState('')
    const [aiLoading, setAiLoading] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [dragging, setDragging] = useState<string | null>(null)
    const [offset, setOffset] = useState({ x: 0, y: 0 })

    const GRID = 20

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
        ctx.fillText('Scale 1:100 · Grid = 2m', 8, canvas.height - 10)

        // Elements
        elements.forEach((el) => {
            ctx.fillStyle = el.color
            ctx.strokeStyle = el.strokeColor
            ctx.lineWidth = 1.5
            const r = 5
            ctx.beginPath()
            ctx.roundRect(el.x, el.y, el.width, el.height, r)
            ctx.fill()
            ctx.stroke()
            ctx.fillStyle = el.strokeColor
            ctx.font = 'bold 11px Plus Jakarta Sans'
            ctx.fillText(el.label, el.x + 8, el.y + 16)
        })
    }, [elements])

    useEffect(() => { draw() }, [draw])

    const snapToGrid = (v: number) => Math.round(v / GRID) * GRID

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (activeTool === 'select') return
        const rect = canvasRef.current!.getBoundingClientRect()
        const x = snapToGrid(e.clientX - rect.left)
        const y = snapToGrid(e.clientY - rect.top)
        const config = toolConfig[activeTool]
        const [w, h] = config.defaultSize
        const newEl: CanvasElement = {
            id: Math.random().toString(36).slice(2),
            type: activeTool,
            label: config.label,
            x, y, width: w, height: h,
            color: config.fill,
            strokeColor: config.stroke,
        }
        setElements((prev) => [...prev, newEl])
    }

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return
        setAiLoading(true)
        // Simulated AI response for demo
        setTimeout(() => {
            const demoElements: CanvasElement[] = [
                { id: 'ai-1', type: 'stage', label: 'Main Stage', x: 240, y: 120, width: 240, height: 100, color: '#fed7aa', strokeColor: '#c2410c' },
                { id: 'ai-2', type: 'truss', label: 'FOH Truss', x: 160, y: 80, width: 400, height: 24, color: '#e0e7ff', strokeColor: '#4f46e5' },
                { id: 'ai-3', type: 'speaker', label: 'L Speaker', x: 140, y: 120, width: 60, height: 100, color: '#fef9c3', strokeColor: '#ca8a04' },
                { id: 'ai-4', type: 'speaker', label: 'R Speaker', x: 520, y: 120, width: 60, height: 100, color: '#fef9c3', strokeColor: '#ca8a04' },
                { id: 'ai-5', type: 'barrier', label: 'Crowd Barrier', x: 160, y: 260, width: 400, height: 20, color: '#f1f5f9', strokeColor: '#64748b' },
            ]
            setElements(demoElements)
            setAiLoading(false)
        }, 1500)
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
                <div className="flex gap-4">
                    {/* Toolbar */}
                    <div className="w-[52px] flex-shrink-0">
                        <div className="bg-surface border border-border rounded-[10px] shadow-sm p-2 space-y-1">
                            {(Object.keys(toolConfig) as CanvasTool[]).map((tool) => (
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
                                onClick={() => setElements([])}
                                className="w-full h-9 flex items-center justify-center rounded-sm text-ink4 hover:bg-red-light hover:text-red transition-all cursor-pointer text-[10px] font-bold"
                                title="Clear canvas"
                            >
                                CLR
                            </button>
                        </div>
                    </div>

                    {/* Canvas area */}
                    <div className="flex-1">
                        <Card>
                            <CardHeader
                                title="2D Floor Plan"
                                action={
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="secondary" icon={<Download size={12} />}>Export PDF</Button>
                                        <Button size="sm" icon={<Save size={12} />}>Save Layout</Button>
                                    </div>
                                }
                            />
                            <div className="p-4">
                                <canvas
                                    ref={canvasRef}
                                    width={800}
                                    height={480}
                                    onClick={handleCanvasClick}
                                    className="w-full rounded-sm border border-border"
                                    style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
                                />
                            </div>
                        </Card>
                    </div>

                    {/* Elements panel */}
                    <div className="w-[200px] flex-shrink-0 space-y-3">
                        {/* AI assist */}
                        <Card>
                            <CardHeader title="AI Layout Assist" />
                            <CardBody>
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="e.g. Festival main stage with FOH truss, two speaker stacks and crowd barrier…"
                                    className="w-full text-[12px] border border-border rounded-sm p-2 bg-surface placeholder:text-ink4 focus:outline-none focus:border-brand resize-none"
                                    rows={4}
                                />
                                <Button
                                    size="sm"
                                    className="w-full justify-center mt-2"
                                    icon={<Wand2 size={12} />}
                                    loading={aiLoading}
                                    onClick={handleAiGenerate}
                                >
                                    Generate Layout
                                </Button>
                            </CardBody>
                        </Card>

                        {/* Elements list */}
                        <Card>
                            <CardHeader title={`Elements (${elements.length})`} />
                            <div className="max-h-48 overflow-y-auto divide-y divide-border">
                                {elements.length === 0 ? (
                                    <div className="p-3 text-[11px] text-ink4 text-center">Click canvas to add elements</div>
                                ) : elements.map((el) => (
                                    <div key={el.id} className="px-3 py-2 flex items-center gap-2 hover:bg-surface2 transition-colors">
                                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: el.strokeColor }} />
                                        <span className="text-[12px] text-ink flex-1 truncate">{el.label}</span>
                                        <button
                                            onClick={() => setElements((prev) => prev.filter((e) => e.id !== el.id))}
                                            className="text-ink4 hover:text-red text-[10px] cursor-pointer"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {tab === '3d' && (
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
            )}

            {tab === 'templates' && (
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
            )}

            {tab === 'import' && (
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
            )}
        </div>
    )
}
