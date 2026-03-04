export interface BudgetLineItemAI {
    category: string;
    supplier: string;
    description: string;
    budgeted: number;
    notes?: string;
}

export interface BudgetEstimateResult {
    summary: string;
    totalExVat: number;
    vat: number;
    totalIncVat: number;
    lineItems: BudgetLineItemAI[];
    savingsTips: string[];
}

export interface SavingsSuggestion {
    category: string;
    issue: string;
    suggestion: string;
    estimatedSaving: number;
}

export interface SavingsResult {
    totalSpend: number;
    potentialSaving: number;
    suggestions: SavingsSuggestion[];
    overallAdvice: string;
}

export interface EstimateEventParams {
    eventName: string;
    eventType: string;
    pax: number;
    days: number;
    city: string;
    notes?: string;
}
