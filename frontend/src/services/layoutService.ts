import { callGemini } from '@/lib/gemini'
import { CanvasElement, LayoutResult, GenerateLayoutParams } from '@/types/layout'
import { db } from '@/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export async function generateLayoutFromDescription(
    params: GenerateLayoutParams
): Promise<LayoutResult> {
    const prompt = `
You are an expert event production stage designer in South Africa.
Generate a 2D venue floor plan layout for the following event.

Event details:
- Description: ${params.description || ''}
- Venue width: ${params.venueWidth}m
- Venue depth: ${params.venueDepth}m
- Attendance: ${params.pax} people
- Event type: ${params.eventType}
- City: ${params.city}

Canvas is ${params.canvasWidth}px wide × ${params.canvasHeight}px tall.
Scale: 1px = ${params.scale}m.

Place elements to make best use of space. Stage should face the audience.
FOH position should be at roughly 2/3 depth from stage.
Leave emergency exit corridors of at least 3m on all sides.

Return JSON in this exact format:
{
  "layoutName": "string",
  "summary": "2-3 sentence plain English description of the layout for the client",
  "technicalNotes": "string — notes for the production team",
  "elements": [
    {
      "id": "string",
      "type": "stage | truss | screen | speaker | barrier | foh | table | generator | toilet | entrance",
      "label": "string",
      "x": 0,
      "y": 0,
      "w": 0,
      "h": 0,
      "rotation": 0,
      "notes": "string"
    }
  ],
  "stagingAdvice": [
    "Tip 1",
    "Tip 2"
  ]
}`

    const response = await callGemini(prompt)

    try {
        const data = response as any

        // Mute incoming array to the application format: width->w, height->h via the AI spec
        // But our application's CanvasElement uses 'width' and 'height'. We will map 'w' to 'width' and 'h' to 'height'
        // and assign default colors if they are omitted.

        const mappedElements: CanvasElement[] = (data.elements || []).map((el: any) => {
            const width = el.w || el.width || 100
            const height = el.h || el.height || 100

            // The colors will be overridden by the visual canvas mapping if needed, but we provide defaults just in case
            return {
                id: el.id || Math.random().toString(36).slice(2),
                type: el.type,
                label: el.label || el.type,
                x: el.x || 0,
                y: el.y || 0,
                width: width,
                height: height,
                rotation: el.rotation || 0,
                notes: el.notes || '',
                source: 'ai-generated' as const,
                color: '#fed7aa', // Fallback color handled centrally
                strokeColor: '#c2410c'
            }
        })

        return {
            layoutName: data.layoutName || 'AI Layout',
            summary: data.summary || '',
            technicalNotes: data.technicalNotes || '',
            elements: mappedElements,
            stagingAdvice: data.stagingAdvice || []
        }
    } catch (err) {
        console.error('Failed to parse Gemini response', err)
        throw new Error('AI returned an unexpected layout. Please try again.')
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

export async function saveLayout(orgId: string, layoutName: string, elements: CanvasElement[], result: LayoutResult) {
    try {
        const docRef = await addDoc(collection(db, `organisations/${orgId}/layouts`), {
            layoutName: layoutName,
            summary: result.summary,
            technicalNotes: result.technicalNotes,
            elements: elements,
            stagingAdvice: result.stagingAdvice,
            createdAt: serverTimestamp()
        })
        return docRef.id
    } catch (error) {
        console.error("Error saving layout: ", error)
        throw new Error('Failed to save layout to Database')
    }
}
