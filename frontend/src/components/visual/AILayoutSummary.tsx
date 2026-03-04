import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LayoutResult } from '@/types/layout'
import { Save, FileText, Settings, Lightbulb, LayoutTemplate } from 'lucide-react'

interface AILayoutSummaryProps {
    result: LayoutResult | null
    onSaveLayout: () => void
    isSaving: boolean
}

export default function AILayoutSummary({ result, onSaveLayout, isSaving }: AILayoutSummaryProps) {
    if (!result) return null

    return (
        <div className="mt-4">
            <Card>
                <CardHeader
                    title={result.layoutName}
                    action={<FileText size={16} className="text-emerald-500" />}
                />
                <CardBody>
                    <div className="space-y-4 text-[12px]">
                        <p className="text-ink3 leading-relaxed mb-4">
                            {result.summary}
                        </p>

                        <div className="grid grid-cols-1 gap-4 border-t border-border pt-4">
                            <div>
                                <h4 className="flex items-center gap-2 font-bold text-ink2 mb-2 uppercase tracking-wide text-[10px]">
                                    <Settings size={12} className="text-ink4" />
                                    Technical Notes
                                </h4>
                                <p className="text-ink4 leading-relaxed">
                                    {result.technicalNotes}
                                </p>
                            </div>

                            <div>
                                <h4 className="flex items-center gap-2 font-bold text-ink2 mb-2 uppercase tracking-wide text-[10px]">
                                    <LayoutTemplate size={12} className="text-ink4" />
                                    Elements Placed ({result.elements.length})
                                </h4>
                                <ul className="text-ink4 space-y-1">
                                    {result.elements.slice(0, 10).map(el => (
                                        <li key={el.id} className="truncate">• {el.label} ({el.type})</li>
                                    ))}
                                    {result.elements.length > 10 && (
                                        <li className="text-ink5 italic">...and {result.elements.length - 10} more</li>
                                    )}
                                </ul>
                            </div>

                            <div>
                                <h4 className="flex items-center gap-2 font-bold text-amber-500 mb-2 uppercase tracking-wide text-[10px]">
                                    <Lightbulb size={12} />
                                    Staging Advice
                                </h4>
                                <ul className="text-ink4 space-y-1.5">
                                    {result.stagingAdvice.map((advice, i) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-amber-500 font-bold">•</span>
                                            <span>{advice}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <Button
                            onClick={onSaveLayout}
                            disabled={isSaving}
                            className="w-full justify-center !bg-emerald-600 hover:!bg-emerald-700 !text-white border-0 mt-2"
                            icon={<Save size={14} />}
                        >
                            {isSaving ? 'Saving...' : 'Save to Event'}
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    )
}
