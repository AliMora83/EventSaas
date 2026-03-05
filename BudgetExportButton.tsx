/**
 * BudgetExportButton.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop-in export button for the Budget page.
 *
 * • Fetches org branding from Firestore /organisations/{orgId}
 * • Wires up PDFDownloadLink from @react-pdf/renderer
 * • Shows loading / error states inline
 * • Accepts a pre-filtered array of BudgetLineItem[] so it works with the
 *   existing useBudget / useBudgetSummary hooks (no duplication of data logic)
 *
 * Place on the Budget page like:
 *
 *   <BudgetExportButton
 *     lineItems={filteredLines}
 *     eventName={event.name}
 *     clientName={event.clientName}
 *     eventDate={event.date}
 *     venue={event.venue}
 *     reference={`REP-${event.id.slice(-6).toUpperCase()}`}
 *   />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useMemo } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { FileDown, Loader2, AlertCircle } from 'lucide-react'

import { db } from '@/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import {
  BudgetPDFDocument,
  type BudgetPDFProps,
  type OrgBranding,
  type BudgetLineItem,
} from './BudgetPDFDocument'

// ─── Firestore org branding shape ─────────────────────────────────────────────
// Extend this to match whatever you store in /organisations/{orgId}

interface OrgDocument {
  companyName?: string
  logoUrl?: string
  primaryColor?: string
  tagline?: string
  vatNumber?: string
  address?: string
  contact?: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BudgetExportButtonProps
  extends Omit<BudgetPDFProps, 'branding' | 'vatRate'> {
  /** Override VAT rate (defaults to 0.15) */
  vatRate?: number
  /** Optional extra class name for the button wrapper */
  className?: string
  /** Optional note printed in the PDF footer */
  footerNote?: string
}

// ─── Firestore fetch ──────────────────────────────────────────────────────────

const fetchOrgBranding = async (orgId: string): Promise<OrgBranding> => {
  const snap = await getDoc(doc(db, 'organisations', orgId))
  if (!snap.exists()) throw new Error('Organisation not found')
  const data = snap.data() as OrgDocument

  return {
    companyName: data.companyName ?? 'Event Production',
    logoUrl:     data.logoUrl,
    primaryColor: data.primaryColor ?? '#c2410c',
    tagline:     data.tagline,
    vatNumber:   data.vatNumber,
    address:     data.address,
    contact:     data.contact,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const BudgetExportButton: React.FC<BudgetExportButtonProps> = ({
  lineItems,
  eventName,
  clientName,
  eventDate,
  venue,
  reference,
  vatRate = 0.15,
  footerNote,
  className,
}) => {
  const { orgId } = useAuthStore()

  // Fetch org branding once, cache indefinitely for the session
  const {
    data: branding,
    isLoading: brandingLoading,
    isError: brandingError,
  } = useQuery<OrgBranding, Error>({
    queryKey: ['orgBranding', orgId],
    queryFn: () => fetchOrgBranding(orgId!),
    enabled: !!orgId,
    staleTime: Infinity,
  })

  // Stable PDF props — only recompute when data changes
  const pdfProps = useMemo<BudgetPDFProps | null>(() => {
    if (!branding) return null
    return {
      branding,
      lineItems,
      eventName,
      clientName,
      eventDate,
      venue,
      reference,
      vatRate,
      footerNote,
    }
  }, [
    branding,
    lineItems,
    eventName,
    clientName,
    eventDate,
    venue,
    reference,
    vatRate,
    footerNote,
  ])

  // Sanitise filename
  const fileName = `budget-report-${eventName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`

  // ── Loading state (branding fetch) ──────────────────────────────────────────
  if (brandingLoading) {
    return (
      <button
        disabled
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)]
          border border-[var(--border)] bg-[var(--surface)]
          text-[var(--ink3)] text-[11.5px] font-medium
          opacity-70 cursor-not-allowed select-none
          ${className ?? ''}
        `}
      >
        <Loader2 size={14} className="animate-spin" />
        Preparing PDF…
      </button>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (brandingError || !pdfProps) {
    return (
      <button
        disabled
        title="Could not load organisation branding. Check Firestore."
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)]
          border border-[var(--red-light)] bg-[var(--red-light)]
          text-[var(--red)] text-[11.5px] font-medium
          opacity-80 cursor-not-allowed select-none
          ${className ?? ''}
        `}
      >
        <AlertCircle size={14} />
        Export unavailable
      </button>
    )
  }

  // ── Ready: PDFDownloadLink ──────────────────────────────────────────────────
  return (
    <PDFDownloadLink
      document={<BudgetPDFDocument {...pdfProps} />}
      fileName={fileName}
      className={className}
    >
      {({ loading, error }) => {
        if (error) {
          return (
            <button
              disabled
              className="
                inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)]
                border border-[var(--red-light)] bg-[var(--red-light)]
                text-[var(--red)] text-[11.5px] font-medium
                opacity-80 cursor-not-allowed select-none
              "
            >
              <AlertCircle size={14} />
              PDF error
            </button>
          )
        }

        return (
          <button
            disabled={loading}
            className={`
              inline-flex items-center gap-2 px-4 py-2
              rounded-[var(--radius-sm)] border
              text-[11.5px] font-medium transition-all duration-150
              ${
                loading
                  ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink3)] opacity-70 cursor-wait'
                  : `
                    border-[var(--border)] bg-[var(--surface)] text-[var(--ink2)]
                    hover:bg-[var(--bg)] hover:border-[var(--border2)]
                    active:scale-[0.98] cursor-pointer
                  `
              }
            `}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <FileDown size={14} />
                Export PDF
              </>
            )}
          </button>
        )
      }}
    </PDFDownloadLink>
  )
}

export default BudgetExportButton
