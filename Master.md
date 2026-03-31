# Master — EventSaaS

## Project Vision
A comprehensive Event Management SaaS platform integrated with Odoo. Features include event registration, attendee management, and real-time synchronization with Odoo's CRM and Accounting modules.

## Metadata
- **Project ID:** EventSaaS
- **Status:** Active Development
- **Version:** 1.0.1
- **Last Sync:** 2026-03-31
- **Stack:** TypeScript / Next.js 15 / Odoo XML-RPC / PostgreSQL / Docker

## Roadmap & Progress
### Phase 1 — Core Integration
- [x] Odoo XML-RPC connection layer
- [x] Event listing and details API
- [x] User registration flow
- [x] Dockerized environment setup

### Phase 2 — Dashboard & Management
- [/] Organizer dashboard implementation
- [/] Attendee check-in system (integration with Event Serve)
- [ ] Advanced reporting and analytics
- [ ] Xero accounting integration (WireXeroUI)

### Phase 3 — Scaling & Multi-tenancy
- [ ] Multi-tenant architecture implementation
- [ ] Custom domain support
- [ ] Global payment gateway integration

## Deployment Strategy
- **Target:** Hostinger VPS (Docker)
- **Environment:** Production
- **CI/CD:** GitHub Actions (Manual trigger)

## Related Documents
- [MasterPlan.md](MasterPlan.md): Detailed architectural plan.
- [Odoo_Master.md](Odoo_Master.md): Original Odoo integration blueprint.
- [AG-WireXeroUI.md](AG-WireXeroUI.md): UI specifications for Xero integration.
