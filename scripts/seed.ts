/**
 * EventSaaS — Firestore Seed Script
 * ===================================
 * Run with:
 *   npx tsx scripts/seed.ts
 *
 * Prerequisites:
 *   1. Paste your Firebase Auth user UID into ADMIN_UID below
 *   2. Save your Firebase service account JSON to scripts/serviceAccountKey.json
 *   3. npm install -D tsx firebase-admin dotenv  (if not already done)
 */

import * as admin from 'firebase-admin'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'

// ============================================================
// ⚙️  CONFIG — PASTE YOUR FIREBASE AUTH USER UID HERE
// ============================================================
const ADMIN_UID: string = 'r4mn4m3WKGebk5cSIrIIpgzmjc12'
const ORG_ID = 'namka-events'

// ============================================================
// Init Firebase Admin
// ============================================================
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json')
if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌  Missing scripts/serviceAccountKey.json')
    console.error('   Firebase Console → Project Settings → Service Accounts → Generate new private key')
    process.exit(1)
}
if (ADMIN_UID === 'PASTE_YOUR_UID_HERE') {
    console.error('❌  Please paste your Firebase Auth UID into ADMIN_UID at the top of this file.')
    console.error('   Firebase Console → Authentication → Users → copy the UID for ali.namka.2@gmail.com')
    process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

// ============================================================
// Helpers
// ============================================================
function ts(year: number, month: number, day: number, hour = 0): Timestamp {
    return Timestamp.fromDate(new Date(year, month - 1, day, hour, 0, 0))
}
function now(): Timestamp { return Timestamp.now() }

async function set(ref: FirebaseFirestore.DocumentReference, data: object) {
    await ref.set(data)
    console.log(`  ✅  ${ref.path}`)
}

// ============================================================
// Main
// ============================================================
async function seed() {
    console.log('\n🌱  EventSaaS Seed Script')
    console.log('━'.repeat(50))

    // ─── 1. Organisation ─────────────────────────────────
    console.log('\n📁  Organisation')
    await set(db.doc(`organisations/${ORG_ID}`), {
        name: 'Namka Events Production',
        vatNumber: '4123456789',
        currency: 'ZAR',
        timezone: 'Africa/Johannesburg',
        createdAt: now(),
    })

    // ─── 2. User (Admin link) ─────────────────────────────
    console.log('\n👤  User doc')
    await set(db.doc(`organisations/${ORG_ID}/users/${ADMIN_UID}`), {
        uid: ADMIN_UID,
        email: 'ali.namka.2@gmail.com',
        displayName: 'Ali Mora',
        role: 'admin',
        orgId: ORG_ID,
        createdAt: now(),
    })
    // Also write top-level user doc so auth listener can find orgId
    await set(db.doc(`users/${ADMIN_UID}`), {
        orgId: ORG_ID,
        role: 'admin',
        email: 'ali.namka.2@gmail.com',
    })

    // ─── 3. Crew Members ──────────────────────────────────
    console.log('\n👷  Crew Members')
    const crewData = [
        {
            id: 'crew-thabo',
            name: 'Thabo Molefe',
            role: 'Head Rigger',
            dayRate: 3200,
            phone: '+27 72 100 0001',
            email: 'thabo@namka.co.za',
            skills: ['rigging', 'truss', 'motors', 'safety'],
            avatarInitials: 'TM',
            avatarColor: '#c44b1e',
        },
        {
            id: 'crew-sipho',
            name: 'Sipho Khumalo',
            role: 'Stage Manager',
            dayRate: 2800,
            phone: '+27 72 100 0002',
            email: 'sipho@namka.co.za',
            skills: ['stage management', 'logistics', 'crew coordination'],
            avatarInitials: 'SK',
            avatarColor: '#2563eb',
        },
        {
            id: 'crew-naledi',
            name: 'Naledi Phiri',
            role: 'Lighting Designer',
            dayRate: 4000,
            phone: '+27 72 100 0003',
            email: 'naledi@namka.co.za',
            skills: ['lighting design', 'MA3', 'GrandMA', 'LED', 'followspots'],
            avatarInitials: 'NP',
            avatarColor: '#7c3aed',
        },
        {
            id: 'crew-brendan',
            name: 'Brendan Nkosi',
            role: 'AV Technician',
            dayRate: 1800,
            phone: '+27 72 100 0004',
            email: 'brendan@namka.co.za',
            skills: ['AV', 'projectors', 'LED walls', 'signal flow'],
            avatarInitials: 'BN',
            avatarColor: '#059669',
        },
        {
            id: 'crew-lisa',
            name: 'Lisa van der Berg',
            role: 'Production Coordinator',
            dayRate: 2200,
            phone: '+27 72 100 0005',
            email: 'lisa@namka.co.za',
            skills: ['project management', 'permits', 'scheduling', 'client liaison'],
            avatarInitials: 'LB',
            avatarColor: '#d97706',
        },
        {
            id: 'crew-moshe',
            name: 'Moshe Zwane',
            role: 'FOH Engineer',
            dayRate: 3500,
            phone: '+27 72 100 0006',
            email: 'moshe@namka.co.za',
            skills: ['FOH', 'DiGiCo', 'Midas', 'system tuning', 'd&b', 'L-Acoustics'],
            avatarInitials: 'MZ',
            avatarColor: '#dc2626',
        },
    ]
    for (const crew of crewData) {
        const { id, ...data } = crew
        await set(db.doc(`organisations/${ORG_ID}/crew/${id}`), { ...data, createdAt: now() })
    }

    // ─── 4. Events ────────────────────────────────────────
    console.log('\n🎪  Events')
    const events = {
        sunbird: {
            id: 'event-sunbird',
            name: 'Sunbird Festival 2026',
            clientName: 'SunMedia Group',
            clientEmail: 'events@sunmedia.co.za',
            venue: 'Johannesburg Expo Centre',
            city: 'Johannesburg',
            date: ts(2026, 3, 14),
            endDate: ts(2026, 3, 15),
            expectedPax: 2500,
            status: 'active',
            budgetStatus: 'over-budget',
            proposalStatus: 'approved',
            createdAt: now(),
            createdBy: ADMIN_UID,
        },
        ctjazz: {
            id: 'event-ctjazz',
            name: 'Cape Town Jazz Weekend',
            clientName: 'JazzSA Foundation',
            clientEmail: 'info@jazzsa.co.za',
            venue: 'CTICC, Cape Town',
            city: 'Cape Town',
            date: ts(2026, 3, 14),
            endDate: ts(2026, 3, 15),
            expectedPax: 800,
            status: 'active',
            budgetStatus: 'on-track',
            proposalStatus: 'approved',
            createdAt: now(),
            createdBy: ADMIN_UID,
        },
        soweto: {
            id: 'event-soweto',
            name: 'Soweto Unplugged',
            clientName: 'Urban Rhythm Co.',
            clientEmail: 'hello@urbanrhythm.co.za',
            venue: 'Walter Sisulu Square',
            city: 'Soweto',
            date: ts(2026, 3, 28),
            endDate: ts(2026, 3, 28),
            expectedPax: 1200,
            status: 'planning',
            budgetStatus: 'pending',
            proposalStatus: 'sent',
            createdAt: now(),
            createdBy: ADMIN_UID,
        },
    }
    for (const [, ev] of Object.entries(events)) {
        const { id, ...data } = ev
        await set(db.doc(`organisations/${ORG_ID}/events/${id}`), data)
    }

    // ─── 5. Budget Lines ──────────────────────────────────
    console.log('\n💰  Budget Lines')

    const sunbirdLines = [
        { category: 'staging', description: 'Main Stage & Rigging Superstructure', supplier: 'StageCraft SA', budgeted: 180000, actual: 210000, status: 'approved' },
        { category: 'av', description: 'PA & Audio System', supplier: 'ProSound Rentals', budgeted: 130000, actual: 148000, status: 'approved' },
        { category: 'lighting', description: 'Full Lighting Rig', supplier: 'LightWorks Africa', budgeted: 85000, actual: 92000, status: 'approved' },
        { category: 'labour', description: 'Crew Labour (all departments)', supplier: 'Namka Crew', budgeted: 95000, actual: 84000, status: 'approved' },
        { category: 'transport', description: 'Trucks & Logistics', supplier: 'TransAfrica Logistics', budgeted: 40000, actual: 44000, status: 'approved' },
        { category: 'permits', description: 'City of JHB Permits & Noise Approval', supplier: 'City of Joburg', budgeted: 22000, actual: 28000, status: 'invoiced' },
        { category: 'other', description: 'Generator & Temporary Power', supplier: 'PowerGen SA', budgeted: 23000, actual: 23000, status: 'approved' },
    ]
    for (let i = 0; i < sunbirdLines.length; i++) {
        const line = sunbirdLines[i]
        const ref = db.doc(`organisations/${ORG_ID}/events/event-sunbird/budgetLines/sunbird-line-${i}`)
        await set(ref, { ...line, vatRate: 15, quoteRef: `QR-SB-${1000 + i}`, attachmentUrl: '', eventId: 'event-sunbird', eventName: 'Sunbird Festival 2026', createdAt: now(), updatedAt: now() })
    }

    const ctjazzLines = [
        { category: 'staging', description: 'Stage Platform & Backline', supplier: 'StageCraft SA', budgeted: 45000, actual: 42000, status: 'approved' },
        { category: 'av', description: 'Full PA System', supplier: 'ProSound Rentals', budgeted: 95000, actual: 91000, status: 'approved' },
        { category: 'lighting', description: 'Lighting Design & Rig', supplier: 'LightWorks Africa', budgeted: 72000, actual: 72000, status: 'approved' },
        { category: 'labour', description: 'Crew Labour', supplier: 'Namka Crew', budgeted: 48000, actual: 45000, status: 'approved' },
        { category: 'transport', description: 'Cape Town Travel & Logistics', supplier: 'TransAfrica Logistics', budgeted: 24000, actual: 23000, status: 'approved' },
    ]
    for (let i = 0; i < ctjazzLines.length; i++) {
        const line = ctjazzLines[i]
        const ref = db.doc(`organisations/${ORG_ID}/events/event-ctjazz/budgetLines/ctjazz-line-${i}`)
        await set(ref, { ...line, vatRate: 15, quoteRef: `QR-CT-${2000 + i}`, attachmentUrl: '', eventId: 'event-ctjazz', eventName: 'Cape Town Jazz Weekend', createdAt: now(), updatedAt: now() })
    }

    const sowetoLines = [
        { category: 'staging', description: 'Stage & Rigging', supplier: 'StageCraft SA', budgeted: 95000, actual: 0, status: 'estimate' },
        { category: 'av', description: 'Sound System', supplier: 'ProSound Rentals', budgeted: 78000, actual: 0, status: 'estimate' },
        { category: 'lighting', description: 'Lighting Rig', supplier: 'LightWorks Africa', budgeted: 54000, actual: 0, status: 'estimate' },
        { category: 'av', description: 'LED Video Wall', supplier: 'ScreenTech Africa', budgeted: 42000, actual: 0, status: 'estimate' },
        { category: 'labour', description: 'Crew Labour', supplier: 'Namka Crew', budgeted: 32000, actual: 0, status: 'estimate' },
        { category: 'transport', description: 'Transport & Logistics', supplier: 'TransAfrica', budgeted: 14000, actual: 0, status: 'estimate' },
        { category: 'permits', description: 'Heritage Site Noise Permit', supplier: 'City of Joburg', budgeted: 5000, actual: 0, status: 'estimate' },
    ]
    for (let i = 0; i < sowetoLines.length; i++) {
        const line = sowetoLines[i]
        const ref = db.doc(`organisations/${ORG_ID}/events/event-soweto/budgetLines/soweto-line-${i}`)
        await set(ref, { ...line, vatRate: 15, quoteRef: `QR-SW-${3000 + i}`, attachmentUrl: '', eventId: 'event-soweto', eventName: 'Soweto Unplugged', createdAt: now(), updatedAt: now() })
    }

    // ─── 6. Tasks ─────────────────────────────────────────
    console.log('\n✅  Tasks')

    const sunbirdTasks = [
        { title: 'Confirm stage dimensions with venue', phase: 'design', startDate: ts(2026, 3, 1), endDate: ts(2026, 3, 3), assignedTo: ['crew-lisa'], status: 'in-progress', priority: 'urgent', notes: 'Venue contact: Mike @ JEC' },
        { title: 'Finalise rigging design — sign-off', phase: 'design', startDate: ts(2026, 3, 1), endDate: ts(2026, 3, 3), assignedTo: ['crew-thabo'], status: 'in-progress', priority: 'urgent', notes: 'Structural engineer sign-off required by 17:00' },
        { title: 'Submit municipal permit application', phase: 'permits', startDate: ts(2026, 3, 3), endDate: ts(2026, 3, 5), assignedTo: ['crew-lisa'], status: 'pending', priority: 'high', notes: '' },
        { title: 'Confirm crew call times', phase: 'loadIn', startDate: ts(2026, 3, 6), endDate: ts(2026, 3, 8), assignedTo: ['crew-lisa'], status: 'pending', priority: 'medium', notes: '' },
        { title: 'Truss delivery to venue', phase: 'delivery', startDate: ts(2026, 3, 10), endDate: ts(2026, 3, 11), assignedTo: ['crew-thabo'], status: 'pending', priority: 'high', notes: '' },
        { title: 'Load-in Day 1 — Stage build', phase: 'loadIn', startDate: ts(2026, 3, 11), endDate: ts(2026, 3, 11, 20), assignedTo: ['crew-thabo', 'crew-sipho'], status: 'pending', priority: 'high', notes: '' },
        { title: 'Load-in Day 2 — AV + Lighting', phase: 'loadIn', startDate: ts(2026, 3, 12), endDate: ts(2026, 3, 12, 20), assignedTo: ['crew-naledi', 'crew-brendan', 'crew-moshe'], status: 'pending', priority: 'high', notes: '' },
        { title: 'Dress rehearsal', phase: 'rehearsal', startDate: ts(2026, 3, 13), endDate: ts(2026, 3, 13, 22), assignedTo: ['crew-sipho', 'crew-moshe'], status: 'pending', priority: 'high', notes: '' },
        { title: '🎤 SHOW DAY — Sunbird Festival', phase: 'showDay', startDate: ts(2026, 3, 14, 8), endDate: ts(2026, 3, 14, 23), assignedTo: ['crew-thabo', 'crew-sipho', 'crew-naledi', 'crew-brendan', 'crew-lisa', 'crew-moshe'], status: 'pending', priority: 'urgent', notes: '' },
        { title: 'Load-out + full derig', phase: 'loadOut', startDate: ts(2026, 3, 15), endDate: ts(2026, 3, 15, 20), assignedTo: ['crew-thabo', 'crew-sipho'], status: 'pending', priority: 'medium', notes: '' },
    ]
    for (let i = 0; i < sunbirdTasks.length; i++) {
        const t = sunbirdTasks[i]
        await set(db.doc(`organisations/${ORG_ID}/events/event-sunbird/tasks/sunbird-task-${i}`), { ...t, eventId: 'event-sunbird', eventName: 'Sunbird Festival 2026', createdAt: now() })
    }

    const ctjazzTasks = [
        { title: 'Finalise AV equipment list', phase: 'design', startDate: ts(2026, 3, 4), endDate: ts(2026, 3, 6), assignedTo: ['crew-brendan'], status: 'in-progress', priority: 'high', notes: '' },
        { title: 'Send crew call times', phase: 'loadIn', startDate: ts(2026, 3, 4), endDate: ts(2026, 3, 6), assignedTo: ['crew-sipho'], status: 'pending', priority: 'medium', notes: '' },
        { title: 'Travel to Cape Town', phase: 'delivery', startDate: ts(2026, 3, 12), endDate: ts(2026, 3, 12), assignedTo: ['crew-sipho', 'crew-brendan'], status: 'pending', priority: 'high', notes: '' },
        { title: 'Load-in CTICC', phase: 'loadIn', startDate: ts(2026, 3, 13), endDate: ts(2026, 3, 13, 22), assignedTo: ['crew-sipho', 'crew-brendan'], status: 'pending', priority: 'high', notes: '' },
        { title: '🎶 SHOW DAY — Cape Town Jazz', phase: 'showDay', startDate: ts(2026, 3, 14, 10), endDate: ts(2026, 3, 14, 23), assignedTo: ['crew-sipho', 'crew-brendan'], status: 'pending', priority: 'urgent', notes: '' },
    ]
    for (let i = 0; i < ctjazzTasks.length; i++) {
        const t = ctjazzTasks[i]
        await set(db.doc(`organisations/${ORG_ID}/events/event-ctjazz/tasks/ctjazz-task-${i}`), { ...t, eventId: 'event-ctjazz', eventName: 'Cape Town Jazz Weekend', createdAt: now() })
    }

    const sowetoTasks = [
        { title: 'Client brief — Urban Rhythm Co.', phase: 'design', startDate: ts(2026, 3, 1), endDate: ts(2026, 3, 5), assignedTo: ['crew-lisa'], status: 'done', priority: 'high', notes: 'Brief completed, signed off by client' },
        { title: 'Send proposal v1 to client', phase: 'design', startDate: ts(2026, 3, 5), endDate: ts(2026, 3, 8), assignedTo: ['crew-lisa'], status: 'in-progress', priority: 'high', notes: '' },
        { title: 'Heritage site noise impact assessment', phase: 'permits', startDate: ts(2026, 3, 5), endDate: ts(2026, 3, 15), assignedTo: ['crew-lisa'], status: 'pending', priority: 'high', notes: '' },
        { title: 'Stage floor plan — client feedback', phase: 'design', startDate: ts(2026, 3, 8), endDate: ts(2026, 3, 12), assignedTo: ['crew-naledi'], status: 'pending', priority: 'medium', notes: '' },
        { title: 'Load-in Day 1 — Soweto', phase: 'loadIn', startDate: ts(2026, 3, 27), endDate: ts(2026, 3, 27, 22), assignedTo: ['crew-thabo', 'crew-naledi', 'crew-lisa'], status: 'pending', priority: 'high', notes: '' },
        { title: '🎸 SHOW DAY — Soweto Unplugged', phase: 'showDay', startDate: ts(2026, 3, 28, 12), endDate: ts(2026, 3, 28, 23), assignedTo: ['crew-naledi', 'crew-moshe', 'crew-lisa'], status: 'pending', priority: 'urgent', notes: '' },
    ]
    for (let i = 0; i < sowetoTasks.length; i++) {
        const t = sowetoTasks[i]
        await set(db.doc(`organisations/${ORG_ID}/events/event-soweto/tasks/soweto-task-${i}`), { ...t, eventId: 'event-soweto', eventName: 'Soweto Unplugged', createdAt: now() })
    }

    // ─── 7. Crew Assignments ──────────────────────────────
    console.log('\n📅  Crew Assignments')
    const assignments = [
        { id: 'assign-0', crewId: 'crew-thabo', crewName: 'Thabo Molefe', role: 'Head Rigger', eventId: 'event-sunbird', eventName: 'Sunbird Festival 2026', startDate: ts(2026, 3, 4), endDate: ts(2026, 3, 15), dayRate: 3200 },
        { id: 'assign-1', crewId: 'crew-sipho', crewName: 'Sipho Khumalo', role: 'Stage Manager', eventId: 'event-sunbird', eventName: 'Sunbird Festival 2026', startDate: ts(2026, 3, 10), endDate: ts(2026, 3, 15), dayRate: 2800 },
        { id: 'assign-2', crewId: 'crew-naledi', crewName: 'Naledi Phiri', role: 'Lighting Designer', eventId: 'event-sunbird', eventName: 'Sunbird Festival 2026', startDate: ts(2026, 3, 10), endDate: ts(2026, 3, 15), dayRate: 4000 },
        { id: 'assign-3', crewId: 'crew-moshe', crewName: 'Moshe Zwane', role: 'FOH Engineer', eventId: 'event-sunbird', eventName: 'Sunbird Festival 2026', startDate: ts(2026, 3, 13), endDate: ts(2026, 3, 15), dayRate: 3500 },
        { id: 'assign-4', crewId: 'crew-sipho', crewName: 'Sipho Khumalo', role: 'Stage Manager', eventId: 'event-ctjazz', eventName: 'Cape Town Jazz Weekend', startDate: ts(2026, 3, 12), endDate: ts(2026, 3, 15), dayRate: 2800 },
        { id: 'assign-5', crewId: 'crew-brendan', crewName: 'Brendan Nkosi', role: 'AV Technician', eventId: 'event-ctjazz', eventName: 'Cape Town Jazz Weekend', startDate: ts(2026, 3, 12), endDate: ts(2026, 3, 15), dayRate: 1800 },
        { id: 'assign-6', crewId: 'crew-naledi', crewName: 'Naledi Phiri', role: 'Lighting Designer', eventId: 'event-soweto', eventName: 'Soweto Unplugged', startDate: ts(2026, 3, 8), endDate: ts(2026, 3, 28), dayRate: 4000 },
        { id: 'assign-7', crewId: 'crew-lisa', crewName: 'Lisa van der Berg', role: 'Production Coordinator', eventId: 'event-soweto', eventName: 'Soweto Unplugged', startDate: ts(2026, 3, 1), endDate: ts(2026, 3, 28), dayRate: 2200 },
        { id: 'assign-8', crewId: 'crew-moshe', crewName: 'Moshe Zwane', role: 'FOH Engineer', eventId: 'event-soweto', eventName: 'Soweto Unplugged', startDate: ts(2026, 3, 27), endDate: ts(2026, 3, 28), dayRate: 3500 },
    ]
    for (const a of assignments) {
        const { id, eventId, ...data } = a
        await set(db.doc(`organisations/${ORG_ID}/events/${eventId}/crewAssignments/${id}`), { ...data, notes: '', createdAt: now() })
    }

    // ─── 8. Equipment ─────────────────────────────────────
    console.log('\n📦  Equipment')
    const equipment = [
        { id: 'eq-par64', name: 'Par64 Cans (LED)', category: 'lighting', subcategory: 'wash', quantity: 24, unit: 'units', purchaseValue: 4200, condition: 'good', icon: '💡', notes: '⚠️ Double-booked 14 Mar' },
        { id: 'eq-dsub', name: 'd&b J-Series Sub', category: 'audio', subcategory: 'sub-woofer', quantity: 8, unit: 'units', purchaseValue: 95000, condition: 'excellent', icon: '🔊', notes: '' },
        { id: 'eq-ledwall', name: 'LED Wall 3×3m', category: 'video', subcategory: 'led-wall', quantity: 4, unit: 'panels', purchaseValue: 120000, condition: 'excellent', icon: '📺', notes: '' },
        { id: 'eq-truss', name: 'Prolyte Truss H30V', category: 'rigging', subcategory: 'box-truss', quantity: 120, unit: 'metres', purchaseValue: 850, condition: 'good', icon: '🏗', notes: '' },
        { id: 'eq-sd12', name: 'DiGiCo SD12 Console', category: 'audio', subcategory: 'console', quantity: 2, unit: 'units', purchaseValue: 380000, condition: 'excellent', icon: '🎛', notes: '' },
        { id: 'eq-stagedeck', name: 'Stage Deck 2×1m', category: 'staging', subcategory: 'decking', quantity: 80, unit: 'panels', purchaseValue: 5500, condition: 'good', icon: '🪵', notes: '' },
        { id: 'eq-sharpy', name: 'Claypaky Sharpy', category: 'lighting', subcategory: 'beam', quantity: 12, unit: 'units', purchaseValue: 55000, condition: 'good', icon: '🎭', notes: '' },
        { id: 'eq-shure', name: 'Shure AD4Q Wireless', category: 'audio', subcategory: 'wireless', quantity: 6, unit: 'units', purchaseValue: 28000, condition: 'excellent', icon: '🎤', notes: '' },
        { id: 'eq-motor', name: 'CM Lodestar Motor 1T', category: 'rigging', subcategory: 'motor', quantity: 18, unit: 'units', purchaseValue: 32000, condition: 'good', icon: '⚙️', notes: '' },
        { id: 'eq-followspot', name: 'Lycian M2 Followspot', category: 'lighting', subcategory: 'followspot', quantity: 4, unit: 'units', purchaseValue: 48000, condition: 'good', icon: '🔦', notes: '' },
        { id: 'eq-aquilon', name: 'Analog Way Aquilon RS4', category: 'video', subcategory: 'processor', quantity: 1, unit: 'unit', purchaseValue: 950000, condition: 'excellent', icon: '🖥', notes: '' },
        { id: 'eq-steeldeck', name: 'Steeldeck Frames 1×1m', category: 'staging', subcategory: 'framing', quantity: 40, unit: 'units', purchaseValue: 3200, condition: 'good', icon: '🔩', notes: '' },
    ]
    for (const item of equipment) {
        const { id, ...data } = item
        await set(db.doc(`organisations/${ORG_ID}/equipment/${id}`), { ...data, serialNumbers: [], createdAt: now() })
    }

    // ─── 9. Equipment Bookings ────────────────────────────
    console.log('\n📋  Equipment Bookings')
    const bookings = [
        { equipId: 'eq-truss', id: 'bk-0', eventId: 'event-sunbird', eventName: 'Sunbird Festival 2026', quantityBooked: 120, startDate: ts(2026, 3, 11), endDate: ts(2026, 3, 15), status: 'checked-out', checkedOutBy: 'Thabo Molefe' },
        { equipId: 'eq-motor', id: 'bk-1', eventId: 'event-sunbird', eventName: 'Sunbird Festival 2026', quantityBooked: 18, startDate: ts(2026, 3, 11), endDate: ts(2026, 3, 15), status: 'checked-out', checkedOutBy: 'Thabo Molefe' },
        { equipId: 'eq-sharpy', id: 'bk-2', eventId: 'event-sunbird', eventName: 'Sunbird Festival 2026', quantityBooked: 9, startDate: ts(2026, 3, 11), endDate: ts(2026, 3, 15), status: 'checked-out', checkedOutBy: 'Naledi Phiri' },
        { equipId: 'eq-stagedeck', id: 'bk-3', eventId: 'event-sunbird', eventName: 'Sunbird Festival 2026', quantityBooked: 60, startDate: ts(2026, 3, 11), endDate: ts(2026, 3, 15), status: 'checked-out', checkedOutBy: 'Sipho Khumalo' },
        { equipId: 'eq-dsub', id: 'bk-4', eventId: 'event-sunbird', eventName: 'Sunbird Festival 2026', quantityBooked: 6, startDate: ts(2026, 3, 11), endDate: ts(2026, 3, 15), status: 'checked-out', checkedOutBy: 'Moshe Zwane' },
        { equipId: 'eq-par64', id: 'bk-5', eventId: 'event-sunbird', eventName: 'Sunbird Festival 2026', quantityBooked: 12, startDate: ts(2026, 3, 13), endDate: ts(2026, 3, 15), status: 'reserved', checkedOutBy: 'Naledi Phiri' },
        { equipId: 'eq-sd12', id: 'bk-6', eventId: 'event-ctjazz', eventName: 'Cape Town Jazz Weekend', quantityBooked: 1, startDate: ts(2026, 3, 13), endDate: ts(2026, 3, 15), status: 'checked-out', checkedOutBy: 'Moshe Zwane' },
        { equipId: 'eq-followspot', id: 'bk-7', eventId: 'event-ctjazz', eventName: 'Cape Town Jazz Weekend', quantityBooked: 2, startDate: ts(2026, 3, 13), endDate: ts(2026, 3, 15), status: 'checked-out', checkedOutBy: 'Naledi Phiri' },
        { equipId: 'eq-par64', id: 'bk-8', eventId: 'event-ctjazz', eventName: 'Cape Town Jazz Weekend', quantityBooked: 12, startDate: ts(2026, 3, 13), endDate: ts(2026, 3, 15), status: 'reserved', checkedOutBy: 'Brendan Nkosi' },
        { equipId: 'eq-stagedeck', id: 'bk-9', eventId: 'event-soweto', eventName: 'Soweto Unplugged', quantityBooked: 40, startDate: ts(2026, 3, 27), endDate: ts(2026, 3, 29), status: 'reserved', checkedOutBy: 'Thabo Molefe' },
        { equipId: 'eq-ledwall', id: 'bk-10', eventId: 'event-soweto', eventName: 'Soweto Unplugged', quantityBooked: 4, startDate: ts(2026, 3, 27), endDate: ts(2026, 3, 29), status: 'reserved', checkedOutBy: 'Brendan Nkosi' },
        { equipId: 'eq-aquilon', id: 'bk-11', eventId: 'event-soweto', eventName: 'Soweto Unplugged', quantityBooked: 1, startDate: ts(2026, 3, 27), endDate: ts(2026, 3, 29), status: 'reserved', checkedOutBy: 'Brendan Nkosi' },
        { equipId: 'eq-shure', id: 'bk-12', eventId: 'event-soweto', eventName: 'Soweto Unplugged', quantityBooked: 4, startDate: ts(2026, 3, 27), endDate: ts(2026, 3, 29), status: 'reserved', checkedOutBy: 'Moshe Zwane' },
    ]
    for (const bk of bookings) {
        const { equipId, id, ...data } = bk
        await set(db.doc(`organisations/${ORG_ID}/equipment/${equipId}/bookings/${id}`), { ...data, createdAt: now() })
    }

    // ─── 10. Proposals ────────────────────────────────────
    console.log('\n📄  Proposals')
    const approvedSections = {
        overview: { status: 'approved', approvedAt: ts(2026, 2, 22) },
        technical: { status: 'approved', approvedAt: ts(2026, 2, 23) },
        budget: { status: 'approved', approvedAt: ts(2026, 2, 24) },
        floorPlan: { status: 'approved', approvedAt: ts(2026, 2, 25) },
    }
    await set(db.doc(`organisations/${ORG_ID}/events/event-sunbird/proposals/prop-sunbird`), {
        version: 2,
        status: 'approved',
        sentAt: ts(2026, 2, 20),
        approvedAt: ts(2026, 2, 25),
        clientSignature: 'Lerato Dlamini',
        portalToken: 'tok-sunbird-2026',
        sections: approvedSections,
        notes: 'Client requested additional LED wall section — added in v2',
    })
    await set(db.doc(`organisations/${ORG_ID}/events/event-ctjazz/proposals/prop-ctjazz`), {
        version: 1,
        status: 'approved',
        sentAt: ts(2026, 2, 18),
        approvedAt: ts(2026, 2, 22),
        clientSignature: 'Priya Naidoo',
        portalToken: 'tok-ctjazz-2026',
        sections: approvedSections,
        notes: '',
    })
    await set(db.doc(`organisations/${ORG_ID}/events/event-soweto/proposals/prop-soweto`), {
        version: 1,
        status: 'sent',
        sentAt: ts(2026, 3, 1),
        portalToken: 'tok-soweto-2026',
        sections: {
            overview: { status: 'approved', approvedAt: ts(2026, 3, 2) },
            technical: { status: 'approved', approvedAt: ts(2026, 3, 2) },
            budget: { status: 'pending' },
            floorPlan: { status: 'pending' },
        },
        notes: 'Waiting on client budget approval',
    })

    // ─── 11. Alerts ───────────────────────────────────────
    console.log('\n🚨  Alerts')
    const alerts = [
        {
            id: 'alert-budget-overrun',
            severity: 'error',
            type: 'budget',
            title: 'Budget overrun — Stage & Rigging',
            message: 'Stage rigging costs 18% over estimate — R 210 000 actual vs R 180 000 budgeted. Review before client sign-off.',
            eventId: 'event-sunbird',
            eventName: 'Sunbird Festival 2026',
            dismissed: false,
            createdAt: now(),
        },
        {
            id: 'alert-task-deadline',
            severity: 'error',
            type: 'task',
            title: 'Rigging Design Freeze — TODAY',
            message: 'Rigging Design Freeze deadline is TODAY. Structural engineer sign-off required by 17:00.',
            eventId: 'event-sunbird',
            eventName: 'Sunbird Festival 2026',
            dismissed: false,
            createdAt: now(),
        },
        {
            id: 'alert-equip-conflict',
            severity: 'warning',
            type: 'equipment',
            title: 'Equipment conflict — Par64 Cans double-booked',
            message: '12 × Par64 Cans double-booked — Cape Town Jazz AND Sunbird Festival both on 14 March. Resolve before load-out.',
            eventId: null,
            eventName: null,
            dismissed: false,
            createdAt: now(),
        },
        {
            id: 'alert-crew-conflict',
            severity: 'warning',
            type: 'crew',
            title: 'Crew conflict — Naledi Phiri double-booked',
            message: 'Naledi Phiri double-booked — Soweto Unplugged AND Sunbird Festival both on 14 March.',
            eventId: null,
            eventName: null,
            dismissed: false,
            createdAt: now(),
        },
    ]
    for (const alert of alerts) {
        const { id, ...data } = alert
        await set(db.doc(`organisations/${ORG_ID}/alerts/${id}`), data)
    }

    // ─── Done ─────────────────────────────────────────────
    console.log('\n' + '━'.repeat(50))
    console.log('✅  Seed complete!')
    console.log('\n📊  Expected Dashboard values:')
    console.log('   Active Events   → 3')
    console.log('   Total Budget    → R 1 179 000')
    console.log('   Equipment Items → 12')
    console.log('   Crew Roster     → 6')
    console.log('\n🚀  Open http://localhost:5173 and refresh!\n')

    process.exit(0)
}

seed().catch((err) => {
    console.error('\n❌  Seed failed:', err)
    process.exit(1)
})
