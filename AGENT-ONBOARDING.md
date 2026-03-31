# AGENT-ONBOARDING — EventSaaS

## Welcome, AGENT
This document defines the constraints and patterns for the EventSaaS project.

## Architecture & Conventions
- **Framework:** Next.js 15 (App Router)
- **Odoo Connection:** Use XML-RPC for data synchronization.
- **Backend:** PostgreSQL for local caching and user preferences.
- **Docker:** Deployment via Docker Compose on Hostinger VPS.
- **Integration:** Closely coupled with `Event Serve` for check-in and `Odoo-BA-API` for Odoo logic.

## Critical Workflows
- **Odoo Sync:** All bidirectional sync operations must be logged and handled with retry logic.
- **Xero Integration:** Follow the specifications in `AG-WireXeroUI.md`.
- **Sync:** The project status is automatically synced to the Namka Mission Control dashboard via `PROJECT-SYNC.json` generated on every push to `main`.

## Verification Loop
1. Run `npm run lint` before committing.
2. Verify Odoo connectivity using the provided scripts (`check-events.ts`).
3. Validate and update `Master.md` and `AI_CHANGELOG.md` for each significant change.
