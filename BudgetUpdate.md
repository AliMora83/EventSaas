# BudgetUpdate — PDF Export Polish
**EventSaaS · eventsaas.namka.cloud**
Prepared for: Antigravity
Date: 2026-03-05
Scope: Phase 2 · PDF Export · Budget Line-Item Report

---

## Overview

This update adds a pixel-perfect, white-label PDF export to the Budget Hub. The PDF is generated entirely client-side using `@react-pdf/renderer`. Org branding (logo, colour, name, VAT number) is pulled live from Firestore so every client sees their own identity on the report — no hardcoding.

Two files are delivered. Drop them in, wire up the button, and add the Firestore fields below.

---

## Deliverables

| File | Destination |
|------|-------------|
| `BudgetPDFDocument.tsx` | `frontend/src/components/budget/BudgetPDFDocument.tsx` |
| `BudgetExportButton.tsx` | `frontend/src/components/budget/BudgetExportButton.tsx` |

---

## Step 1 — Place the Files

Copy both files into `frontend/src/components/budget/`. No new directories needed — the `budget/` folder already exists per the master plan architecture.

---

## Step 2 — Dependency Check

`@react-pdf/renderer` is already in the stack. Confirm it is installed:

```bash
cd frontend
npm list @react-pdf/renderer
```

If missing:

```bash
npm install @react-pdf/renderer
```

> **Note:** `@react-pdf/renderer` uses a custom React reconciler. It must **not** be bundled with the main React tree. Vite handles this automatically — no extra config needed.

---

## Step 3 — Firestore — Add Org Branding Fields

Add the following fields to the `/organisations/{orgId}` document in Firestore. All fields are optional except `companyName` (which falls back to `"Event Production"` if absent).

```
/organisations/{orgId}
  companyName   : string   // e.g. "Namka Events Production"
  tagline       : string   // e.g. "Event Production Services"
  logoUrl       : string   // Public URL to PNG or JPG logo image
  primaryColor  : string   // Hex colour, e.g. "#c2410c"
  vatNumber     : string   // e.g. "4XXXXXXXXX"
  address       : string   // Single-line address for PDF footer
  contact       : string   // Website or email for PDF footer
```

**Security rules** — these fields are already inside the org document which is admin-read-only. No rule changes needed.

**Logo hosting** — `logoUrl` must be a publicly accessible URL (Firebase Storage with public read, or CDN). `@react-pdf/renderer` fetches images at render time in the browser. If the URL requires auth it will silently fall back to the initial placeholder.

---

## Step 4 — Wire Up the Button on Budget.tsx

Open `frontend/src/pages/Budget.tsx`. In the event-level budget header (where the event name and status badge appear), add the export button:

```tsx
import { BudgetExportButton } from '@/components/budget/BudgetExportButton'

// Inside the render, alongside the existing "+ Add Quote" or event header actions:
<BudgetExportButton
  lineItems={filteredLines}           // BudgetLineItem[] — from useBudget hook
  eventName={event.name}
  clientName={event.clientName}
  eventDate={event.date}              // ISO string e.g. "2026-03-14"
  venue={event.venue}
  reference={`REP-${event.id.slice(-6).toUpperCase()}`}
  footerNote="This report is confidential. Pricing subject to change without notice."
/>
```

The button handles its own loading and error states — no extra UI needed.

---

## Step 5 — Type Alignment

`BudgetPDFDocument.tsx` exports a `BudgetLineItem` interface. Align it with the existing `BudgetLine` type in `frontend/src/types/budget.ts`.

The PDF interface expects:

```ts
export interface BudgetLineItem {
  id: string
  category: string
  description: string   // ← map from your existing field name if different
  supplier: string
  budgeted: number
  actual: number
  status: 'approved' | 'pending' | 'estimate' | 'invoiced' | 'paid'
  notes?: string
}
```

If your Firestore `budgetLines` collection uses different field names (e.g. `vendorName` instead of `supplier`), map them at the call site before passing to the button — keep the PDF component clean and decoupled from Firestore naming.

Example mapping:

```ts
const pdfLines: BudgetLineItem[] = budgetLines.map(line => ({
  id:          line.id,
  category:    line.category,
  description: line.description ?? line.itemName,
  supplier:    line.supplier ?? line.vendorName,
  budgeted:    line.budgeted,
  actual:      line.actual,
  status:      line.status,
  notes:       line.notes,
}))
```

---

## Step 6 — Verify

Run the dev server and open the Budget Hub:

```bash
npm run dev
```

1. Navigate to **Cost & Budget Hub** → select an event with line items.
2. Click **Export PDF** — the button should show a `Generating…` spinner for ~1–2 seconds while `@react-pdf/renderer` compiles the PDF in the browser.
3. The file downloads as `budget-report-{event-name}-{date}.pdf`.
4. Open the PDF and verify:
   - [ ] Org logo or initial placeholder renders in the header
   - [ ] Brand colour applied to accent line, total, and ref number
   - [ ] All line items present with correct ZAR formatting
   - [ ] Over-budget rows show red left-accent and tinted row background
   - [ ] VAT row and grand total correct at 15%
   - [ ] Footer shows org name, VAT number, page numbers
   - [ ] Filename is sanitised (no spaces or special characters)

---

## PDF Layout Reference

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  Company Name          Budget Report            │  ← Dark header band
│          Tagline               Event Name               │
│          Contact               Ref: REP-XXXXXX          │
├─────────────────────────────────────────────────────────┤  ← Brand colour line
│  Client │ Date │ Venue │ VAT Rate │ VAT Reg │ Generated │  ← Event info row
├─────────────────────────────────────────────────────────┤
│  Category │ Description │ Supplier │ Budgeted │ Actual  │  ← Table header
│           │ Variance % │ Status                         │
│  ─────────────────────────────────────────────────────  │
│  row · row · row (alt tint) · over-budget row (red)     │
├─────────────────────────────────────────────────────────┤
│                              Total Budgeted   R xxx     │  ← Summary (right-aligned)
│                              Total Actual     R xxx     │
│                              Variance         R xxx     │
│                              VAT @ 15%        R xxx     │
│                              TOTAL (incl VAT) R xxx     │  ← Brand colour
├─────────────────────────────────────────────────────────┤
│  Company · VAT · Address · Footer note    Page X of Y  │  ← Fixed footer
└─────────────────────────────────────────────────────────┘
```

Orientation: **Landscape A4**. Repeats header and footer on every page for multi-page reports.

---

## Programmatic Export (Optional — for Email / Attachments)

`BudgetPDFDocument.tsx` also exports a `generateBudgetPDF` async helper that returns a `Blob`. Use this when you need to attach the PDF to a Resend email (Phase 2) or upload it to Firebase Storage without triggering a browser download:

```ts
import { generateBudgetPDF } from '@/components/budget/BudgetPDFDocument'

const blob = await generateBudgetPDF(pdfProps)

// Attach to email (Resend — Phase 2)
// Or upload to Firebase Storage
const storageRef = ref(storage, `organisations/${orgId}/reports/${fileName}`)
await uploadBytes(storageRef, blob)
```

---

## Notes for Phase 2

- **Resend email integration** — when that module is built, use `generateBudgetPDF` above to attach the budget report to the proposal send workflow.
- **Proposal PDF** — a separate `ProposalPDFDocument.tsx` will follow the same pattern. The `OrgBranding` type and `BudgetExportButton` architecture are designed to be reused.
- **Multi-page reports** — `@react-pdf/renderer` paginates automatically. The header band and footer are marked `fixed` so they repeat. No action needed for large event budgets.
- **Currency** — hardcoded to ZAR (`R`) and `en-ZA` locale throughout. When multi-currency is added in Phase 3, pass a `currency` prop to `BudgetPDFDocument`.
