import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

const SA_BUDGET_CONTEXT = `
You are an expert event production budget consultant in South Africa.
All costs must be in ZAR (South African Rand). Apply 15% VAT where indicated.
Use realistic South African market rates for AV, staging, lighting, rigging, crew, transport and catering.
Typical crew day rates: Head Rigger R2,800–R3,500, Stage Manager R2,500–R3,000,
Lighting Designer R3,500–R4,500, AV Tech R1,500–R2,200,
FOH Engineer R3,000–R4,000, Production Coordinator R2,000–R2,500.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.
`;

/** General-purpose Gemini call with SA budget context (for cost estimation etc.) */
export async function callGemini(prompt: string): Promise<unknown> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(SA_BUDGET_CONTEXT + "\n\n" + prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
}

/** Dedicated Gemini call for layout generation — no budget context, tuned for reliable JSON */
export async function callGeminiForLayout(prompt: string): Promise<unknown> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
        },
    });
    let text = result.response.text();
    // Safety net: strip markdown fences if model ignores responseMimeType
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
}
