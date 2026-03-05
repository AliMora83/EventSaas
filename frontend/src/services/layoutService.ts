import { callGeminiForLayout } from '@/lib/gemini'
import { CanvasElement, LayoutResult, GenerateLayoutParams } from '@/types/layout'
import { db } from '@/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

// ── Valid element types for whitelist validation ──
const VALID_TYPES = new Set(['stage', 'truss', 'screen', 'speaker', 'barrier', 'foh', 'table', 'generator', 'toilet', 'entrance'])

/**
 * Build a production-grade prompt for Gemini layout generation.
 * Uses metre-based coordinates per the VisualAI spec.
 */
function buildLayoutPrompt(description: string, venueW: number, venueD: number, pax: number, eventType: string, city: string): string {
    return `You are a professional event production layout assistant for a South African live events company based in ${city}.

The user has described their event. Generate a floor plan layout as a JSON object.

USER DESCRIPTION:
"${description}"

EVENT TYPE: ${eventType}
EXPECTED PAX: ${pax}
VENUE SIZE: ${venueW}m wide × ${venueD}m deep

RULES:
- Return ONLY a JSON object with the structure shown below. No markdown, no explanation, no code fences.
- Each element must have exactly these fields: type, xm, ym, wm, hm, label
- Valid types: stage, truss, screen, speaker, barrier, foh, table, generator, toilet, entrance
- All coordinates and dimensions are in metres
- xm + wm must be ≤ ${venueW}
- ym + hm must be ≤ ${venueD}
- xm ≥ 0, ym ≥ 0
- The stage should face the audience (place stage near ym=3–8)
- FOH position should be roughly centre-venue, towards the back third (ym ≈ ${Math.round(venueD * 0.6)}–${Math.round(venueD * 0.75)})
- Crowd barriers go between stage and audience area
- Leave emergency exit corridors of at least 3m on all sides
- Do not place elements outside the venue boundary
- Label elements descriptively (e.g. "Main Stage", "PA Stack L", "Screen R", "FOH Mix")
- Generate between 4 and 16 elements depending on event complexity
- Use realistic event production dimensions

TYPE HINTS (metres):
- stage: wm 10–20, hm 6–10
- truss: wm 15–35, hm 1–2 (place just in front of or above stage)
- screen: wm 4–8, hm 3–5
- speaker: wm 1.5–3, hm 3–5 (place stage left and right)
- barrier: wm 15–40, hm 0.8–1.2
- foh: wm 3–5, hm 2–4
- table: wm 2–5, hm 2–4
- generator: wm 3–5, hm 3–5 (place away from audience, near venue perimeter)
- toilet: wm 2–4, hm 2–4 (place near venue perimeter)
- entrance: wm 3–6, hm 1–2 (place at venue edge)

REQUIRED OUTPUT FORMAT:
{
  "layoutName": "string — short name for this layout",
  "summary": "2-3 sentence plain English description of the layout for the client",
  "technicalNotes": "string — notes for the production team (rigging, power, safety)",
  "elements": [
    {"type": "stage", "xm": 20, "ym": 4, "wm": 16, "hm": 8, "label": "Main Stage"},
    {"type": "truss", "xm": 16, "ym": 2.5, "wm": 24, "hm": 1.5, "label": "Front Truss"},
    {"type": "speaker", "xm": 14, "ym": 6, "wm": 2, "hm": 4, "label": "PA L"},
    {"type": "speaker", "xm": 40, "ym": 6, "wm": 2, "hm": 4, "label": "PA R"},
    {"type": "barrier", "xm": 12, "ym": 22, "wm": 28, "hm": 1, "label": "Crowd Barrier"},
    {"type": "foh", "xm": 26, "ym": 42, "wm": 4, "hm": 3, "label": "FOH / Mix"}
  ],
  "stagingAdvice": ["Tip 1", "Tip 2"]
}`
}

/**
 * Validate and sanitise Gemini-returned elements.
 * Clamps all coordinates within venue bounds and filters invalid types.
 */
function sanitiseElements(
    rawElements: any[],
    venueW: number,
    venueD: number,
    canvasWidth: number,
    canvasHeight: number
): CanvasElement[] {
    const pxPerMetreX = canvasWidth / venueW
    const pxPerMetreY = canvasHeight / venueD

    return rawElements
        .filter(el => el && VALID_TYPES.has(el.type))
        .map((el, i) => {
            // Clamp metre values within venue bounds
            const wm = Math.max(0.5, Math.min(venueW, Number(el.wm) || 4))
            const hm = Math.max(0.5, Math.min(venueD, Number(el.hm) || 4))
            const xm = Math.max(0, Math.min(venueW - wm, Number(el.xm) || 0))
            const ym = Math.max(0, Math.min(venueD - hm, Number(el.ym) || 0))

            // Convert metres → canvas pixels
            return {
                id: `ai-${Date.now()}-${i}`,
                type: el.type,
                label: String(el.label || el.type).slice(0, 40),
                x: Math.round(xm * pxPerMetreX),
                y: Math.round(ym * pxPerMetreY),
                width: Math.round(wm * pxPerMetreX),
                height: Math.round(hm * pxPerMetreY),
                rotation: 0,
                notes: '',
                source: 'ai-generated' as const,
                color: '#fed7aa',
                strokeColor: '#c2410c',
            }
        })
}

export async function generateLayoutFromDescription(
    params: GenerateLayoutParams
): Promise<LayoutResult> {
    const prompt = buildLayoutPrompt(
        params.description || '',
        params.venueWidth,
        params.venueDepth,
        params.pax,
        params.eventType,
        params.city
    )

    const response = await callGeminiForLayout(prompt)

    try {
        const data = response as any
        const rawElements = data.elements || []

        if (!Array.isArray(rawElements) || rawElements.length === 0) {
            throw new Error('AI returned an empty layout. Try adding more detail to your description.')
        }

        const mappedElements = sanitiseElements(
            rawElements,
            params.venueWidth,
            params.venueDepth,
            params.canvasWidth,
            params.canvasHeight
        )

        if (mappedElements.length === 0) {
            throw new Error('No valid elements after validation — try rephrasing your description.')
        }

        return {
            layoutName: data.layoutName || 'AI Layout',
            summary: data.summary || '',
            technicalNotes: data.technicalNotes || '',
            elements: mappedElements,
            stagingAdvice: data.stagingAdvice || []
        }
    } catch (err: any) {
        if (err.message?.includes('AI returned') || err.message?.includes('No valid elements')) {
            throw err // Re-throw our custom errors
        }
        console.error('Failed to parse Gemini response', err)
        throw new Error('AI returned an unexpected layout format. Please try again.')
    }
}

export async function generateLayoutFromTemplate(
    templateName: string,
    params: GenerateLayoutParams
): Promise<LayoutResult> {
    const templates: Record<string, string> = {
        'Festival Main Stage': 'Large outdoor festival. Main stage centre-back, two delay towers at 40m, FOH centre at 60m, VIP area front-left, GA standing, two large LED screens flanking stage.',
        'Corporate Gala': 'Indoor gala dinner. Stage centre-front, round tables for seated guests, dance floor in front of stage, bar at rear, registration at entrance.',
        'Conference': 'Conference setup. Lectern stage front-centre, theatre-style seating rows, two screens flanking stage, breakout tables at rear.',
        'Awards Ceremony': 'Awards show. Wide stage with walkway, theatre seating, red carpet entrance, cameras positions at FOH and sides.',
        'Community Event': 'Open community event. Small stage one end, market stalls along sides, open centre space, entrance gate with barriers.',
        'Product Launch': 'Product launch. Central display plinth, audience in semicircle, LED backdrop, reception tables at sides.',
    }

    const templateDescription = templates[templateName] || templateName
    return generateLayoutFromDescription({
        ...params,
        description: templateDescription,
    })
}

export async function saveLayout(orgId: string, layoutName: string, elements: CanvasElement[], result?: LayoutResult) {
    try {
        const docRef = await addDoc(collection(db, `organisations/${orgId}/layouts`), {
            name: layoutName,
            layoutName: layoutName,
            summary: result?.summary || '',
            technicalNotes: result?.technicalNotes || '',
            elements: elements,
            stagingAdvice: result?.stagingAdvice || [],
            createdAt: serverTimestamp()
        })
        return docRef.id
    } catch (error) {
        console.error("Error saving layout: ", error)
        throw new Error('Failed to save layout to Database')
    }
}
