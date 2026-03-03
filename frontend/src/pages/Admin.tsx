import React, { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import {
    collection, getDocs, doc, getDoc, setDoc, deleteDoc,
    addDoc, onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'
import {
    Shield, Download, UserPlus, ChevronDown, X, Save, Trash2,
    Search, Plus, ToggleLeft, ToggleRight, Users, Database,
    ClipboardList, Flag, Eye, EyeOff,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const ORG_ID = import.meta.env.VITE_ORG_ID || 'namka-events'
const ORG_PATH = `organisations/${ORG_ID}`

const COLLECTIONS = [
    'events', 'equipment', 'crew', 'budgetLines',
    'alerts', 'users', 'proposals', 'auditLog',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getBadgeStyle(val: unknown): React.CSSProperties {
    const v = String(val).toLowerCase()
    if (['active', 'approved', 'on-track', 'excellent', 'true', 'created'].includes(v))
        return { background: '#dcfce7', color: '#166534', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }
    if (['planning', 'sent', 'editor'].includes(v))
        return { background: '#dbeafe', color: '#1e40af', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }
    if (['pending', 'amber'].includes(v))
        return { background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }
    if (['over-budget', 'red', 'deleted'].includes(v))
        return { background: '#fee2e2', color: '#991b1b', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }
    if (['admin'].includes(v))
        return { background: '#ffedd5', color: '#9a3412', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }
    if (['updated'].includes(v))
        return { background: '#dbeafe', color: '#1e40af', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }
    return { background: '#f1f5f9', color: '#475569', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }
}

const BADGE_KEYS = ['status', 'budgetstatus', 'role', 'action', 'type']
const MONEY_KEYS = ['budget', 'actual', 'budgeted', 'rate', 'value', 'amount', 'total']
const MONEY_FIELDS = (key: string) => MONEY_KEYS.some(k => key.toLowerCase().includes(k))

function renderCell(key: string, val: unknown) {
    if (val === undefined || val === null) return <span style={{ color: '#94a3b8' }}>—</span>
    if (val instanceof Timestamp) return <span>{val.toDate().toLocaleDateString('en-ZA')}</span>
    const str = String(val)
    if (key === 'id' || key.endsWith('Id') || key.endsWith('UID'))
        return <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>{str.slice(0, 16)}{str.length > 16 ? '…' : ''}</span>
    if (BADGE_KEYS.some(k => key.toLowerCase() === k))
        return <span style={getBadgeStyle(val)}>{str}</span>
    if (MONEY_FIELDS(key) && typeof val === 'number')
        return <span>R {val.toLocaleString()}</span>
    if (typeof val === 'boolean')
        return <span style={getBadgeStyle(val)}>{str}</span>
    if (str.length > 40) return <span title={str}>{str.slice(0, 38)}…</span>
    return <span>{str}</span>
}

function formatTimestamp(ts: Timestamp | Date | string | undefined): string {
    if (!ts) return ''
    const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts as string)
    const now = new Date()
    const diff = now.getDate() - d.getDate()
    const time = d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
    if (diff === 0) return `Today ${time}`
    if (diff === 1) return `Yesterday ${time}`
    return `${d.getDate()} ${d.toLocaleString('en-ZA', { month: 'short' })} ${time}`
}

// ─── Audit logger ─────────────────────────────────────────────────────────────
async function writeAudit(action: string, colId: string, docId: string, user: string, detail: string, eventName?: string) {
    await addDoc(collection(db, ORG_PATH, 'auditLog'), {
        action, collection: colId, docId, user, detail,
        eventName: eventName || '',
        timestamp: serverTimestamp(),
    })
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
    const addToast = useAppStore(s => s.addToast)
    return {
        success: (message: string) => addToast({ type: 'success', message }),
        error: (message: string) => addToast({ type: 'error', message }),
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Firestore Browser
// ══════════════════════════════════════════════════════════════════════════════
function FirestoreBrowser({ userName }: { userName: string }) {
    const [selectedCol, setSelectedCol] = useState('events')
    const [docs, setDocs] = useState<Array<{ id: string;[k: string]: unknown }>>([])
    const [columns, setColumns] = useState<string[]>([])
    const [search, setSearch] = useState('')
    const [selectedDoc, setSelectedDoc] = useState<{ id: string;[k: string]: unknown } | null>(null)
    const [editedFields, setEditedFields] = useState<Record<string, string>>({})
    const [showNewPanel, setShowNewPanel] = useState(false)
    const [newDocId, setNewDocId] = useState('')
    const [newDocJson, setNewDocJson] = useState('{\n  "field": "value"\n}')
    const toast = useToast()

    const loadCollection = useCallback(async (colId: string) => {
        const snap = await getDocs(collection(db, ORG_PATH, colId))
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setDocs(rows)
        if (rows.length > 0) {
            const keys = Array.from(new Set(rows.flatMap(r => Object.keys(r))))
            setColumns(['id', ...keys.filter(k => k !== 'id').slice(0, 7)])
        } else {
            setColumns(['id'])
        }
    }, [])

    useEffect(() => { loadCollection(selectedCol) }, [selectedCol, loadCollection])

    const filtered = docs.filter(d =>
        Object.values(d).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
    )

    async function handleSave() {
        if (!selectedDoc) return
        const updates: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(editedFields)) {
            updates[k] = v === 'true' ? true : v === 'false' ? false : isNaN(Number(v)) ? v : Number(v)
        }
        const ref = doc(db, ORG_PATH, selectedCol, selectedDoc.id)
        await setDoc(ref, updates, { merge: true })
        await writeAudit('UPDATED', selectedCol, selectedDoc.id, userName,
            Object.entries(editedFields).map(([k, v]) => `${k}: ${selectedDoc[k]} → ${v}`).join(', '))
        toast.success('✓ Saved · audit log updated')
        setSelectedDoc(null)
        loadCollection(selectedCol)
    }

    async function handleDelete() {
        if (!selectedDoc) return
        if (!window.confirm(`Delete document "${selectedDoc.id}"? This cannot be undone.`)) return
        await deleteDoc(doc(db, ORG_PATH, selectedCol, selectedDoc.id))
        await writeAudit('DELETED', selectedCol, selectedDoc.id, userName, 'Document deleted')
        toast.success('🗑 Document deleted · logged to audit')
        setSelectedDoc(null)
        loadCollection(selectedCol)
    }

    async function handleCreate() {
        let parsed: Record<string, unknown>
        try { parsed = JSON.parse(newDocJson) } catch { toast.error('Invalid JSON'); return }
        const colRef = collection(db, ORG_PATH, selectedCol)
        let newId = newDocId.trim()
        if (newId) {
            await setDoc(doc(db, ORG_PATH, selectedCol, newId), parsed)
        } else {
            const ref = await addDoc(colRef, parsed)
            newId = ref.id
        }
        await writeAudit('CREATED', selectedCol, newId, userName, 'New document created')
        toast.success('✓ Document created · audit log updated')
        setShowNewPanel(false)
        setNewDocId('')
        setNewDocJson('{\n  "field": "value"\n}')
        loadCollection(selectedCol)
    }

    function openDoc(row: typeof docs[0]) {
        setSelectedDoc(row)
        const fields: Record<string, string> = {}
        for (const [k, v] of Object.entries(row)) {
            if (k !== 'id') fields[k] = v instanceof Timestamp ? v.toDate().toISOString() : String(v ?? '')
        }
        setEditedFields(fields)
    }

    return (
        <div style={{ position: 'relative' }}>
            {/* Controls */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Collection:</label>
                    <select
                        value={selectedCol}
                        onChange={e => { setSelectedCol(e.target.value); setSearch('') }}
                        style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 10px', fontSize: 13, background: '#fff', cursor: 'pointer' }}
                    >
                        {COLLECTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div style={{
                    background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 20,
                    padding: '3px 12px', fontSize: 12, color: '#c2410c', fontWeight: 500,
                }}>
                    {ORG_PATH} / {selectedCol}
                </div>
                <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        placeholder="Search docs…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6, border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                    />
                </div>
                <button
                    onClick={() => setShowNewPanel(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#c2410c', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                    <Plus size={14} /> New Document
                </button>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{selectedCol} — {filtered.length} documents</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Click any row to view / edit</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {columns.map(col => (
                                    <th key={col} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                        {col}
                                    </th>
                                ))}
                                <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }} />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={columns.length + 1} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No documents found</td></tr>
                            ) : filtered.map((row, i) => (
                                <tr
                                    key={row.id}
                                    onClick={() => openDoc(row)}
                                    style={{ cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#fff7ed')}
                                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa')}
                                >
                                    {columns.map(col => (
                                        <td key={col} style={{ padding: '9px 12px', verticalAlign: 'middle' }}>
                                            {renderCell(col, row[col])}
                                        </td>
                                    ))}
                                    <td style={{ padding: '9px 12px' }}>
                                        <button
                                            onClick={e => { e.stopPropagation(); openDoc(row) }}
                                            style={{ background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                                        >Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Slide Panel — Edit Doc */}
            {selectedDoc && (
                <>
                    <div onClick={() => setSelectedDoc(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
                    <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 480, background: '#fff', zIndex: 50, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{selectedDoc.id}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{ORG_PATH}/{selectedCol}/{selectedDoc.id}</div>
                            </div>
                            <button onClick={() => setSelectedDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
                        </div>
                        <div style={{ flex: 1, overflow: 'y-auto', padding: '16px 20px', overflowY: 'auto' }}>
                            {Object.entries(selectedDoc).filter(([k]) => k !== 'id').map(([k, v]) => (
                                <div key={k} style={{ marginBottom: 14 }}>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k}</label>
                                    <input
                                        value={editedFields[k] ?? ''}
                                        onChange={e => setEditedFields(f => ({ ...f, [k]: e.target.value }))}
                                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box' }}
                                    />
                                </div>
                            ))}
                            {/* Raw JSON */}
                            <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Raw JSON</div>
                                <pre style={{ background: '#1e293b', color: '#e2e8f0', borderRadius: 6, padding: 12, fontSize: 11, overflowX: 'auto', lineHeight: 1.5 }}>
                                    {JSON.stringify(selectedDoc, (_, v) => v instanceof Timestamp ? v.toDate().toISOString() : v, 2)}
                                </pre>
                            </div>
                        </div>
                        <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8 }}>
                            <button onClick={handleSave} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#c2410c', color: '#fff', border: 'none', borderRadius: 6, padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                <Save size={14} /> Save Changes
                            </button>
                            <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Slide Panel — New Doc */}
            {showNewPanel && (
                <>
                    <div onClick={() => setShowNewPanel(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
                    <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 440, background: '#fff', zIndex: 50, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>New Document — {selectedCol}</div>
                            <button onClick={() => setShowNewPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
                        </div>
                        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Document ID (optional)</label>
                            <input
                                value={newDocId}
                                onChange={e => setNewDocId(e.target.value)}
                                placeholder="Leave blank for auto-ID"
                                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 12, marginBottom: 16, boxSizing: 'border-box' }}
                            />
                            <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>JSON Body</label>
                            <textarea
                                value={newDocJson}
                                onChange={e => setNewDocJson(e.target.value)}
                                rows={16}
                                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: 10, fontSize: 12, fontFamily: 'monospace', boxSizing: 'border-box', resize: 'vertical' }}
                            />
                        </div>
                        <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0' }}>
                            <button onClick={handleCreate} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#c2410c', color: '#fff', border: 'none', borderRadius: 6, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                <Save size={14} /> Create Document
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — User Management
// ══════════════════════════════════════════════════════════════════════════════
interface OrgUser { id: string; name: string; email: string; role: string; lastSignIn: string; status: string }

const SEED_USERS: OrgUser[] = [
    { id: 'r4mn4m3', name: 'Ali Mora', email: 'ali.namka.2@gmail.com', role: 'admin', lastSignIn: '3 Mar 2026', status: 'Active' },
    { id: 'lisa-vdb', name: 'Lisa van der Berg', email: 'lisa.vdb@namkaevents.co.za', role: 'editor', lastSignIn: '2 Mar 2026', status: 'Active' },
    { id: 'thabo-m', name: 'Thabo Molefe', email: 'thabo@stagerigsa.co.za', role: 'editor', lastSignIn: '1 Mar 2026', status: 'Active' },
    { id: 'priya-n', name: 'Priya Naidoo', email: 'priya@jazzsa.co.za', role: 'viewer', lastSignIn: '28 Feb 2026', status: 'Client' },
]

function avatarColor(name: string) {
    const colors = ['#c2410c', '#1e40af', '#065f46', '#7c3aed', '#9a3412']
    return colors[name.length % colors.length]
}

function initials(name: string) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function UserManagement({ currentUserId, userName }: { currentUserId: string; userName: string }) {
    const [users, setUsers] = useState<OrgUser[]>(SEED_USERS)
    const [inviteName, setInviteName] = useState('')
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('editor')
    const toast = useToast()

    async function handleRoleChange(userId: string, newRole: string) {
        const user = users.find(u => u.id === userId)
        if (!user) return
        await setDoc(doc(db, ORG_PATH, 'users', userId), { role: newRole }, { merge: true })
        await writeAudit('UPDATED', 'users', userId, userName, `role: ${user.role} → ${newRole}`, user.name)
        setUsers(us => us.map(u => u.id === userId ? { ...u, role: newRole } : u))
        toast.success(`Role updated to "${newRole}" · saved to Firestore`)
    }

    async function handleInvite() {
        if (!inviteEmail || !inviteName) return
        const newId = `user-${Date.now()}`
        await setDoc(doc(db, ORG_PATH, 'users', newId), {
            name: inviteName, email: inviteEmail, role: inviteRole,
            status: 'invited', orgId: ORG_ID, createdAt: serverTimestamp(),
        })
        await writeAudit('CREATED', 'users', newId, userName, `Invited ${inviteEmail} as ${inviteRole}`)
        toast.success(`✉️ Invite sent to ${inviteEmail}`)
        setUsers(us => [...us, { id: newId, name: inviteName, email: inviteEmail, role: inviteRole, lastSignIn: '—', status: 'Active' }])
        setInviteName(''); setInviteEmail(''); setInviteRole('editor')
    }

    const roleStyle = (role: string): React.CSSProperties => ({
        border: '1px solid',
        borderRadius: 6,
        padding: '3px 8px',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        ...(role === 'admin' ? { background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' }
            : role === 'editor' ? { background: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' }
                : { background: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' }),
    })

    return (
        <div>
            {/* Users table */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Organisation Users — Namka Events</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            {['User', 'Email', 'Role', 'Last Sign-in', 'Status', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 700, fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, i) => {
                            const isMe = u.id === 'r4mn4m3'
                            return (
                                <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: avatarColor(u.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                                {initials(u.name)}
                                            </div>
                                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{u.email}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        {isMe ? (
                                            <span style={roleStyle(u.role)}>{u.role}</span>
                                        ) : (
                                            <select
                                                value={u.role}
                                                onChange={e => handleRoleChange(u.id, e.target.value)}
                                                style={roleStyle(u.role)}
                                            >
                                                <option value="admin">admin</option>
                                                <option value="editor">editor</option>
                                                <option value="viewer">viewer</option>
                                            </select>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{u.lastSignIn}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            fontSize: 12, fontWeight: 600,
                                            color: u.status === 'Active' ? '#166534' : '#475569',
                                            background: u.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                                            borderRadius: 4, padding: '2px 8px',
                                        }}>
                                            ● {u.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        {isMe ? (
                                            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>You</span>
                                        ) : (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button style={{ background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                                                <button style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Disable</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Invite form */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '20px 24px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Invite New User</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 12, alignItems: 'end' }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Full Name</label>
                        <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="e.g. Sipho Khumalo" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Email Address</label>
                        <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@example.co.za" type="email" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Role</label>
                        <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, cursor: 'pointer' }}>
                            <option value="editor">editor</option>
                            <option value="viewer">viewer</option>
                            <option value="admin">admin</option>
                        </select>
                    </div>
                    <button onClick={handleInvite} style={{ background: '#c2410c', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Send Invite
                    </button>
                </div>
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Audit Log
// ══════════════════════════════════════════════════════════════════════════════
const SEED_LOG = [
    { id: '1', action: 'UPDATED', collection: 'budgetLines', docId: 'line-sb-1', user: 'Ali Mora', detail: 'actual: 180000 → 210000', eventName: 'Sunbird Festival', timestamp: null },
    { id: '2', action: 'CREATED', collection: 'equipment', docId: 'equip-subwoofer', user: 'Ali Mora', detail: 'Added Sub-Woofer', eventName: 'Audio · 6 units', timestamp: null },
    { id: '3', action: 'UPDATED', collection: 'users', docId: 'r4mn4m3…', user: 'Ali Mora', detail: 'role: editor → admin', eventName: 'Thabo Molefe', timestamp: null },
    { id: '4', action: 'CREATED', collection: 'events', docId: 'event-soweto', user: 'Ali Mora', detail: 'Soweto Unplugged', eventName: 'Urban Rhythm Co. · 28 Mar 2026', timestamp: null },
    { id: '5', action: 'UPDATED', collection: 'proposals', docId: 'proposal-sw-1', user: 'Ali Mora', detail: 'status: draft → sent', eventName: 'Soweto Unplugged', timestamp: null },
    { id: '6', action: 'DELETED', collection: 'alerts', docId: 'alert-5', user: 'Ali Mora', detail: 'Resolved: transport delay alert', eventName: 'Sunbird Festival', timestamp: null },
    { id: '7', action: 'CREATED', collection: 'crew', docId: 'crew-moshe', user: 'Ali Mora', detail: 'Moshe Zwane · FOH Engineer · R3,500/day', eventName: '', timestamp: null },
    { id: '8', action: 'UPDATED', collection: 'events', docId: 'event-sunbird', user: 'Lisa van der Berg', detail: 'expectedPax: 2000 → 2500', eventName: '', timestamp: null },
]

const SEED_TIMES = ['Today 09:14', 'Today 08:52', 'Yesterday 17:30', '2 Mar 16:44', '2 Mar 14:22', '1 Mar 11:05', '28 Feb 09:30', '27 Feb 15:18']

const ACTION_COLORS: Record<string, string> = {
    CREATED: '#22c55e', UPDATED: '#3b82f6', DELETED: '#ef4444',
}

function AuditLog() {
    const [col, setCol] = useState('All Collections')
    const [user, setUser] = useState('All Users')
    const [range, setRange] = useState('Last 30 days')
    const [liveLog, setLiveLog] = useState<typeof SEED_LOG>([])

    useEffect(() => {
        const unsub = onSnapshot(collection(db, ORG_PATH, 'auditLog'), snap => {
            const entries = snap.docs.map(d => ({ id: d.id, ...d.data() } as typeof SEED_LOG[0]))
                .sort((a, b) => {
                    const ta = a.timestamp as Timestamp | null
                    const tb = b.timestamp as Timestamp | null
                    return (tb?.seconds ?? 0) - (ta?.seconds ?? 0)
                })
            setLiveLog(entries)
        })
        return unsub
    }, [])

    const displayLog = liveLog.length > 0 ? liveLog : SEED_LOG

    function exportCsv() {
        const rows = displayLog.map(e => `"${e.action}","${e.collection}","${e.docId}","${e.user}","${e.detail}"`)
        const csv = ['Action,Collection,DocId,User,Detail', ...rows].join('\n')
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv])); a.download = 'audit-log.csv'; a.click()
    }

    return (
        <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                {[
                    { val: col, set: setCol, opts: ['All Collections', ...COLLECTIONS] },
                    { val: user, set: setUser, opts: ['All Users', 'Ali Mora', 'Lisa van der Berg'] },
                    { val: range, set: setRange, opts: ['Last 30 days', 'Today', 'Last 7 days'] },
                ].map(({ val, set, opts }) => (
                    <select key={val} value={val} onChange={e => set(e.target.value)}
                        style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
                        {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                ))}
                <button onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#475569' }}>
                    <Download size={13} /> Export CSV
                </button>
            </div>

            {/* Log card */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Audit Log — {displayLog.length} events</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Append-only · cannot be deleted</span>
                </div>
                <div style={{ padding: '4px 0' }}>
                    {displayLog.map((entry, i) => (
                        <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 20px', borderBottom: i < displayLog.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ACTION_COLORS[entry.action] ?? '#f59e0b', marginTop: 5, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 3 }}>
                                    <span style={{ ...getBadgeStyle(entry.action), marginRight: 8 }}>{entry.action}</span>
                                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{entry.collection} / {entry.docId}</span>
                                </div>
                                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span>{entry.user}</span>
                                    {entry.detail && (
                                        <span style={{ background: '#f1f5f9', fontFamily: 'monospace', fontSize: 11, borderRadius: 4, padding: '1px 6px', color: '#475569' }}>{entry.detail}</span>
                                    )}
                                    {entry.eventName && <span style={{ color: '#94a3b8' }}>· {entry.eventName}</span>}
                                </div>
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {entry.timestamp ? formatTimestamp(entry.timestamp as Timestamp) : SEED_TIMES[i] ?? ''}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Feature Flags
// ══════════════════════════════════════════════════════════════════════════════
const MODULE_FLAGS = [
    { key: 'budgetHub', label: '💰 Budget Hub', desc: 'Cost tracking, vendor quotes, line items', default: true },
    { key: 'inventory', label: '📦 Inventory', desc: 'Equipment tracking, bookings, conflicts', default: true },
    { key: 'timeline', label: '📅 Timeline', desc: 'Gantt chart, crew scheduling, milestones', default: true },
    { key: 'proposals', label: '📋 Proposals', desc: 'Client presentations and digital sign-off', default: true },
    { key: 'visualEngine', label: '🎨 Visual Engine', desc: '2D/3D floor plan builder', default: false },
]

const SYSTEM_FLAGS = [
    { key: 'aiAssist', label: '🤖 AI Assist (Gemini)', desc: 'Budget estimator, layout generator, proposal copy', default: true },
    { key: 'emailNotif', label: '📧 Email Notifications', desc: 'Proposal sent, sign-off alerts via Resend', default: true },
    { key: 'pushNotif', label: '🔔 Push Notifications', desc: 'Browser push via Firebase Cloud Messaging', default: false },
]

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', padding: 2,
                background: on ? '#22c55e' : '#cbd5e1', transition: 'background 0.2s', position: 'relative', flexShrink: 0,
            }}
            aria-checked={on} role="switch"
        >
            <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transform: on ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
        </button>
    )
}

function FeatureFlags({ userName }: { userName: string }) {
    const initModules = Object.fromEntries(MODULE_FLAGS.map(f => [f.key, f.default]))
    const initSystem = Object.fromEntries(SYSTEM_FLAGS.map(f => [f.key, f.default]))
    const [modules, setModules] = useState<Record<string, boolean>>(initModules)
    const [system, setSystem] = useState<Record<string, boolean>>(initSystem)
    const toast = useToast()

    async function toggleModule(key: string, label: string) {
        const next = !modules[key]
        setModules(m => ({ ...m, [key]: next }))
        await setDoc(doc(db, ORG_PATH, 'featureFlags', 'modules'), { [key]: next }, { merge: true })
        await writeAudit('UPDATED', 'featureFlags', 'modules', userName, `${key}: ${!next} → ${next}`)
        toast.success(`${label} ${next ? 'enabled' : 'disabled'} · flag saved`)
    }

    async function toggleSystem(key: string, label: string) {
        const next = !system[key]
        setSystem(s => ({ ...s, [key]: next }))
        await setDoc(doc(db, ORG_PATH, 'featureFlags', 'system'), { [key]: next }, { merge: true })
        await writeAudit('UPDATED', 'featureFlags', 'system', userName, `${key}: ${!next} → ${next}`)
        toast.success(`${label} ${next ? 'enabled' : 'disabled'} · flag saved`)
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
            {/* Module Visibility */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Module Visibility</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Namka Events · all users</span>
                </div>
                {MODULE_FLAGS.map((f, i) => (
                    <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < MODULE_FLAGS.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{f.label}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{f.desc}</div>
                        </div>
                        <Toggle on={modules[f.key]} onChange={() => toggleModule(f.key, f.label)} />
                    </div>
                ))}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* System Flags */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>System Flags</span>
                    </div>
                    {SYSTEM_FLAGS.map((f, i) => (
                        <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < SYSTEM_FLAGS.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{f.label}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{f.desc}</div>
                            </div>
                            <Toggle on={system[f.key]} onChange={() => toggleSystem(f.key, f.label)} />
                        </div>
                    ))}
                </div>

                {/* SaaS Tier */}
                <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a', borderRadius: 8, padding: '18px 20px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>🚀 SaaS Tier Control</div>
                    <div style={{ fontSize: 12, color: '#78350f', marginBottom: 14, lineHeight: 1.5 }}>
                        When you onboard new event companies, use feature flags to control which modules they can access based on their subscription tier.
                    </div>
                    {[
                        { tier: 'Free tier', desc: 'Dashboard + Inventory only' },
                        { tier: 'Pro tier', desc: 'All modules + AI Assist' },
                        { tier: 'Enterprise', desc: 'Pro + Visual Engine + Custom branding' },
                    ].map(({ tier, desc }) => (
                        <div key={tier} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #fde68a' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>{tier}</span>
                            <span style={{ fontSize: 11, color: '#78350f' }}>{desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// STATS ROW
// ══════════════════════════════════════════════════════════════════════════════
function StatsRow() {
    const stats = [
        { label: 'TOTAL USERS', value: '4', sub: '1 admin · 2 editors · 1 viewer' },
        { label: 'COLLECTIONS', value: '8', sub: '47 total documents' },
        { label: 'AUDIT EVENTS', value: '124', sub: 'Last 30 days' },
        { label: 'FEATURE FLAGS', value: '6', sub: '5 active · 1 disabled' },
    ]
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {stats.map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.sub}</div>
                </div>
            ))}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN PANEL
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
    { id: 'firestore', label: '🗄 Firestore Browser', icon: Database },
    { id: 'users', label: '👥 User Management', icon: Users },
    { id: 'audit', label: '📋 Audit Log', icon: ClipboardList },
    { id: 'flags', label: '🚩 Feature Flags', icon: Flag },
]

export function Admin() {
    const { role, user } = useAuthStore()
    const [activeTab, setActiveTab] = useState('firestore')

    // Role guard
    if (role !== null && role !== 'admin') {
        return <Navigate to="/dashboard" replace />
    }

    const userName = user?.displayName || 'Admin'
    const userId = user?.uid || ''

    return (
        <div>
            {/* Page header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 24, fontStyle: 'italic', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                        Admin Panel
                    </h1>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                        <Shield size={11} /> Admin only
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#475569' }}>
                        <Download size={13} /> Export Audit Log
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#c2410c', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <UserPlus size={14} /> Invite User
                    </button>
                </div>
            </div>

            {/* Stats */}
            <StatsRow />

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e2e8f0', marginBottom: 24 }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #c2410c' : '2px solid transparent',
                            color: activeTab === tab.id ? '#c2410c' : '#64748b',
                            marginBottom: -2, transition: 'color 0.15s',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === 'firestore' && <FirestoreBrowser userName={userName} />}
            {activeTab === 'users' && <UserManagement currentUserId={userId} userName={userName} />}
            {activeTab === 'audit' && <AuditLog />}
            {activeTab === 'flags' && <FeatureFlags userName={userName} />}
        </div>
    )
}
