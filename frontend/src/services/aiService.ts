import { callGemini } from "@/lib/gemini";
import type {
    EstimateEventParams,
    BudgetEstimateResult,
    SavingsResult,
} from "@/types/ai";

export async function estimateEventBudget(
    params: EstimateEventParams
): Promise<BudgetEstimateResult> {
    const prompt = `
Generate a detailed production budget for the following event:
- Event name: ${params.eventName}
- Event type: ${params.eventType}
- Attendance: ${params.pax} people
- Production days: ${params.days}
- City: ${params.city}, South Africa
- Notes: ${params.notes || "none"}

Return JSON in this exact format:
{
  "summary": "string",
  "totalExVat": 0,
  "vat": 0,
  "totalIncVat": 0,
  "lineItems": [
    {
      "category": "staging",
      "supplier": "StageCraft SA",
      "description": "string",
      "budgeted": 0,
      "notes": "string"
    }
  ],
  "savingsTips": ["string"]
}`;
    return callGemini(prompt) as Promise<BudgetEstimateResult>;
}

export async function suggestBudgetSavings(
    budgetLines: unknown[]
): Promise<SavingsResult> {
    const prompt = `
Analyse these event production budget line items and suggest cost savings:
${JSON.stringify(budgetLines, null, 2)}

Return JSON in this exact format:
{
  "totalSpend": 0,
  "potentialSaving": 0,
  "suggestions": [
    {
      "category": "string",
      "issue": "string",
      "suggestion": "string",
      "estimatedSaving": 0
    }
  ],
  "overallAdvice": "string"
}`;
    return callGemini(prompt) as Promise<SavingsResult>;
}
