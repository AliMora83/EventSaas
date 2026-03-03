# EventSaaS — Production Management Platform

> **eventsaas.namka.cloud** · Built for large-scale event production companies in South Africa

EventSaaS is a unified, web-based platform that replaces the fragmented spreadsheets, WhatsApps and email chains that plague event production workflows. From the first budget estimate to the final load-out, every stakeholder works in one place.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🗓 **Dashboard** | Live overview of all active events, budget health, pending tasks and crew status |
| 💰 **Budget Hub** | Line-item budgeting with ZAR + VAT, vendor quote tracking, invoice/PO management |
| 📦 **Inventory Manager** | Equipment catalogue with condition tracking, availability calendar, maintenance log |
| 📅 **Timeline & Crew** | Production Gantt chart, crew scheduling, milestone tracker, Kanban task board |
| 📄 **Client Proposals** | Digital proposals with section-by-section client sign-off and portal links |
| 🖼 **Visual Engine** | 2D floor-plan canvas (click-to-place, snap-to-grid) with AI layout suggestions |

---

## 🎯 Ideal Use Case — Start to End

### Scenario: *Sunbird Festival — 5 000-pax outdoor concert*

**1. Pre-production (8 weeks out)**
- PM creates the event in EventSaaS → sets date, venue, expected pax, client name
- Budget Hub: adds line items by category (Staging · AV · Lighting · Labour · Transport)
- System auto-calculates VAT (15%) and flags any over-budget categories in real time
- PDF proposal generated → sent to client via portal link for digital sign-off

**2. Procurement (6 weeks out)**
- Vendor quotes uploaded against each budget line → status moves `estimate → quoted → approved`
- Equipment Manager: PM checks stock availability, spots a scheduling conflict on the d&b subs, resolves with a sub-rental entry
- Purchase Orders raised and tracked inside the platform

**3. Crew Scheduling (3 weeks out)**
- Production Gantt built: Design → Permits → Delivery → Load-in → Show Day → Load-out phases
- Crew assigned to shifts; day rates auto-pulled into labour budget
- Automated crew call times exportable to WhatsApp/email

**4. Show Week**
- Floor plan drawn in the Visual Engine (stage, truss, screens, barriers snapped to grid)
- Floor plan attached to proposal for venue sign-off
- Task board switches to Kanban — crew tick off tasks as they go; PM sees live status

**5. Post-event**
- All invoices marked `paid` in Budget Hub → final P&L auto-calculated
- Equipment condition updated post- load-out (any damage flagged into maintenance log)
- Client gets a final report PDF; PM archives the event for future reference

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 (warm neutral design system) |
| State | Zustand + TanStack React Query |
| Backend / DB | Firebase Auth · Firestore · Storage |
| AI | Google Gemini (layout suggestions, budget insights) |
| PDF Export | `@react-pdf/renderer` |
| Charts | Recharts |
| Canvas | HTML5 Canvas (2D) · Three.js planned (3D Phase 3) |

---

## 🚀 Local Development

```bash
# 1. Clone
git clone https://github.com/AliMora83/EventSaas.git
cd EventSaas/frontend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# → Fill in your Firebase project credentials in .env

# 4. Start dev server
npm run dev
# → http://localhost:5173
```

### Environment Variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ORG_ID=your-org-id
VITE_GEMINI_API_KEY=        # optional
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password + Google
3. Create a **Firestore** database (start in test mode)
4. Copy your web app config into `.env`

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/        # Sidebar, Topbar, AppLayout
│   │   └── ui/            # Design system components
│   ├── hooks/             # React Query + Firestore hooks
│   ├── pages/             # Route-level page components
│   ├── store/             # Zustand stores (auth, app state)
│   ├── types/             # TypeScript interfaces
│   └── firebase.ts        # Firebase initialisation
├── .env.example
└── vite.config.ts
```

---

## 🏗 Roadmap

- **Phase 1 (current):** Dashboard · Budget · Inventory · Timeline · Proposals · Visual Engine
- **Phase 2:** Xero invoice sync · Resend email automation · PDF export polish · 3D preview
- **Phase 3:** Mobile PWA · Offline mode · Advanced AI budgeting · Multi-org white-label

---

## 📄 License

Private — © 2026 Namka Events. All rights reserved.
