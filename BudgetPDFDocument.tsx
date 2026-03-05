/**
 * BudgetPDFDocument.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * @react-pdf/renderer — Budget Line-Item Report PDF
 * White-label: branding is pulled from the org record in Firestore.
 *
 * Usage:
 *   import { BudgetPDFDocument } from '@/components/budget/BudgetPDFDocument'
 *
 * Drop-in with PDFDownloadLink (see BudgetExportButton.tsx) or PDFViewer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrgBranding {
  /** Organisation / company name shown on the PDF header */
  companyName: string
  /** Optional URL to the org's logo image (PNG or JPG) */
  logoUrl?: string
  /**
   * Primary brand colour as a hex string, e.g. "#c2410c".
   * Falls back to EventSaaS brand orange-red if not provided.
   */
  primaryColor?: string
  /** Short tagline shown beneath the company name, e.g. "Event Production Services" */
  tagline?: string
  /** VAT / registration number */
  vatNumber?: string
  /** Physical address (single line) */
  address?: string
  /** Website or contact email */
  contact?: string
}

export type BudgetStatus =
  | 'approved'
  | 'pending'
  | 'estimate'
  | 'invoiced'
  | 'paid'

export interface BudgetLineItem {
  id: string
  category: string
  description: string
  supplier: string
  budgeted: number
  actual: number
  status: BudgetStatus
  notes?: string
}

export interface BudgetPDFProps {
  branding: OrgBranding
  /** Event this report belongs to */
  eventName: string
  clientName: string
  eventDate: string   // ISO date string, e.g. "2026-03-14"
  venue: string
  /** Reference number shown in the report header */
  reference: string
  lineItems: BudgetLineItem[]
  /** VAT rate as a decimal, e.g. 0.15 for 15% */
  vatRate?: number
  /** Optional note printed at the bottom of the report */
  footerNote?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatZAR = (value: number): string =>
  `R ${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
}

const variance = (budgeted: number, actual: number): number => actual - budgeted

const variancePct = (budgeted: number, actual: number): string => {
  if (budgeted === 0) return '—'
  const pct = ((actual - budgeted) / budgeted) * 100
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

const STATUS_LABELS: Record<BudgetStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  estimate: 'Estimate',
  invoiced: 'Invoiced',
  paid: 'Paid',
}

// ─── Styles factory (accepts brand colour) ────────────────────────────────────

const makeStyles = (brand: string) =>
  StyleSheet.create({
    // Page
    page: {
      fontFamily: 'Helvetica',
      backgroundColor: '#ffffff',
      paddingTop: 0,
      paddingBottom: 52,
      paddingHorizontal: 0,
      fontSize: 9,
      color: '#1c1917',
    },

    // ── Header band ──────────────────────────────────────────────────────────
    headerBand: {
      backgroundColor: '#1c1917',
      paddingVertical: 28,
      paddingHorizontal: 36,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flex: 1,
    },
    headerLogo: {
      width: 44,
      height: 44,
      borderRadius: 8,
      marginBottom: 10,
      objectFit: 'contain',
    },
    headerLogoPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: brand,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    headerLogoInitial: {
      color: '#ffffff',
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
    },
    headerCompanyName: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 15,
      color: '#ffffff',
      marginBottom: 3,
      letterSpacing: 0.3,
    },
    headerTagline: {
      fontSize: 9,
      color: '#a8a29e',
      marginBottom: 2,
    },
    headerContact: {
      fontSize: 8,
      color: '#78716c',
    },
    headerRight: {
      alignItems: 'flex-end',
    },
    headerReportLabel: {
      fontSize: 8,
      color: '#78716c',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    headerReportTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 18,
      color: '#ffffff',
      marginBottom: 6,
    },
    headerRef: {
      fontSize: 8,
      color: brand,
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 0.5,
    },
    accentLine: {
      height: 3,
      backgroundColor: brand,
    },

    // ── Event info block ─────────────────────────────────────────────────────
    eventBlock: {
      paddingHorizontal: 36,
      paddingTop: 22,
      paddingBottom: 18,
      flexDirection: 'row',
      gap: 0,
      borderBottomWidth: 1,
      borderBottomColor: '#e2ddd8',
    },
    eventInfoGroup: {
      flex: 1,
    },
    eventInfoLabel: {
      fontSize: 7.5,
      color: '#a8a29e',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 3,
      fontFamily: 'Helvetica-Bold',
    },
    eventInfoValue: {
      fontSize: 10,
      color: '#1c1917',
      fontFamily: 'Helvetica-Bold',
    },
    eventInfoValueLight: {
      fontSize: 9,
      color: '#44403c',
    },

    // ── Section heading ──────────────────────────────────────────────────────
    section: {
      paddingHorizontal: 36,
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 7.5,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      color: '#a8a29e',
      marginBottom: 10,
    },

    // ── Table ────────────────────────────────────────────────────────────────
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f5f4f0',
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
      borderWidth: 1,
      borderColor: '#e2ddd8',
    },
    tableHeaderCell: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 7.5,
      color: '#78716c',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#f0ede8',
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderLeftColor: '#e2ddd8',
      borderRightColor: '#e2ddd8',
    },
    tableRowAlt: {
      backgroundColor: '#faf9f7',
    },
    tableRowOverBudget: {
      backgroundColor: '#fff5f5',
    },
    tableCell: {
      fontSize: 9,
      color: '#44403c',
    },
    tableCellBold: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1c1917',
    },
    tableCellMuted: {
      fontSize: 8,
      color: '#a8a29e',
    },
    tableCellRed: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#dc2626',
    },
    tableCellGreen: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#059669',
    },

    // Col widths (total = 100%)
    colCategory:    { width: '14%' },
    colDescription: { width: '22%' },
    colSupplier:    { width: '18%' },
    colBudgeted:    { width: '13%', textAlign: 'right' },
    colActual:      { width: '13%', textAlign: 'right' },
    colVariance:    { width: '12%', textAlign: 'right' },
    colStatus:      { width: '8%',  textAlign: 'center' },

    // ── Summary / totals block ────────────────────────────────────────────────
    summaryBlock: {
      paddingHorizontal: 36,
      marginTop: 20,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    summaryTable: {
      width: 260,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#f0ede8',
    },
    summaryLabel: {
      fontSize: 9,
      color: '#78716c',
    },
    summaryValue: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1c1917',
    },
    summaryValueRed: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#dc2626',
    },
    summaryValueGreen: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#059669',
    },
    summaryTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 10,
      paddingBottom: 10,
      borderTopWidth: 2,
      borderTopColor: '#1c1917',
      marginTop: 4,
    },
    summaryTotalLabel: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#1c1917',
    },
    summaryTotalValue: {
      fontSize: 13,
      fontFamily: 'Helvetica-Bold',
      color: brand,
    },

    // ── Status badge (text-based for PDF) ────────────────────────────────────
    statusBadge: {
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 3,
      fontSize: 7,
      fontFamily: 'Helvetica-Bold',
      textAlign: 'center',
    },

    // ── Variance band (inline bar) ────────────────────────────────────────────
    overBudgetBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: '#dc2626',
    },

    // ── Footer ────────────────────────────────────────────────────────────────
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 36,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: '#e2ddd8',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#ffffff',
    },
    footerLeft: {
      flex: 1,
    },
    footerText: {
      fontSize: 7.5,
      color: '#a8a29e',
    },
    footerNote: {
      fontSize: 7.5,
      color: '#78716c',
      marginTop: 2,
      fontStyle: 'italic',
    },
    footerPageNum: {
      fontSize: 8,
      color: '#a8a29e',
      textAlign: 'right',
    },
    footerBrand: {
      fontSize: 7.5,
      color: '#c8c4bf',
      textAlign: 'right',
      marginTop: 2,
    },
  })

// ─── Status badge colour helper ───────────────────────────────────────────────

const STATUS_STYLES: Record<
  BudgetStatus,
  { bg: string; color: string }
> = {
  approved: { bg: '#d1fae5', color: '#065f46' },
  pending:  { bg: '#fef3c7', color: '#92400e' },
  estimate: { bg: '#f1f5f9', color: '#475569' },
  invoiced: { bg: '#dbeafe', color: '#1e40af' },
  paid:     { bg: '#d1fae5', color: '#065f46' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const EventInfoItem: React.FC<{
  label: string
  value: string
  styles: ReturnType<typeof makeStyles>
}> = ({ label, value, styles }) => (
  <View style={styles.eventInfoGroup}>
    <Text style={styles.eventInfoLabel}>{label}</Text>
    <Text style={styles.eventInfoValue}>{value}</Text>
  </View>
)

// ─── Main PDF Document ────────────────────────────────────────────────────────

export const BudgetPDFDocument: React.FC<BudgetPDFProps> = ({
  branding,
  eventName,
  clientName,
  eventDate,
  venue,
  reference,
  lineItems,
  vatRate = 0.15,
  footerNote,
}) => {
  const brand = branding.primaryColor ?? '#c2410c'
  const styles = makeStyles(brand)

  // Totals
  const totalBudgeted = lineItems.reduce((s, l) => s + l.budgeted, 0)
  const totalActual   = lineItems.reduce((s, l) => s + l.actual, 0)
  const totalVariance = totalActual - totalBudgeted
  const vatAmount     = totalActual * vatRate
  const grandTotal    = totalActual + vatAmount

  const companyInitial = branding.companyName.charAt(0).toUpperCase()
  const generatedOn = new Date().toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <Document
      title={`Budget Report — ${eventName}`}
      author={branding.companyName}
      subject="Budget Line-Item Report"
      keywords="budget, event, production"
    >
      <Page size="A4" style={styles.page} orientation="landscape">

        {/* ── Header band ──────────────────────────────────────────────── */}
        <View style={styles.headerBand} fixed>
          {/* Left: org identity */}
          <View style={styles.headerLeft}>
            {branding.logoUrl ? (
              <Image src={branding.logoUrl} style={styles.headerLogo} />
            ) : (
              <View style={styles.headerLogoPlaceholder}>
                <Text style={styles.headerLogoInitial}>{companyInitial}</Text>
              </View>
            )}
            <Text style={styles.headerCompanyName}>{branding.companyName}</Text>
            {branding.tagline && (
              <Text style={styles.headerTagline}>{branding.tagline}</Text>
            )}
            {branding.contact && (
              <Text style={styles.headerContact}>{branding.contact}</Text>
            )}
          </View>

          {/* Right: report identity */}
          <View style={styles.headerRight}>
            <Text style={styles.headerReportLabel}>Budget Report</Text>
            <Text style={styles.headerReportTitle}>{eventName}</Text>
            <Text style={styles.headerRef}>Ref: {reference}</Text>
          </View>
        </View>

        {/* Accent line */}
        <View style={styles.accentLine} fixed />

        {/* ── Event info row ────────────────────────────────────────────── */}
        <View style={styles.eventBlock}>
          <EventInfoItem label="Client" value={clientName}            styles={styles} />
          <EventInfoItem label="Event Date" value={formatDate(eventDate)} styles={styles} />
          <EventInfoItem label="Venue" value={venue}                  styles={styles} />
          <EventInfoItem label="VAT Rate" value={`${(vatRate * 100).toFixed(0)}%`} styles={styles} />
          {branding.vatNumber && (
            <EventInfoItem label="VAT Reg." value={branding.vatNumber} styles={styles} />
          )}
          <EventInfoItem label="Generated" value={generatedOn}        styles={styles} />
        </View>

        {/* ── Line items table ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Line Items</Text>

          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colCategory]}>Category</Text>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colSupplier]}>Supplier</Text>
            <Text style={[styles.tableHeaderCell, styles.colBudgeted]}>Budgeted</Text>
            <Text style={[styles.tableHeaderCell, styles.colActual]}>Actual</Text>
            <Text style={[styles.tableHeaderCell, styles.colVariance]}>Variance</Text>
            <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
          </View>

          {/* Table rows */}
          {lineItems.map((line, i) => {
            const v = variance(line.budgeted, line.actual)
            const isOver = v > 0 && line.actual > 0
            const rowStyle = isOver
              ? [styles.tableRow, styles.tableRowOverBudget]
              : i % 2 === 1
              ? [styles.tableRow, styles.tableRowAlt]
              : [styles.tableRow]

            const statusStyle = STATUS_STYLES[line.status]

            return (
              <View key={line.id} style={rowStyle} wrap={false}>
                {/* Over-budget left accent */}
                {isOver && <View style={styles.overBudgetBar} />}

                <Text style={[styles.tableCellBold, styles.colCategory]}>
                  {line.category}
                </Text>
                <View style={styles.colDescription}>
                  <Text style={styles.tableCell}>{line.description}</Text>
                  {line.notes && (
                    <Text style={styles.tableCellMuted}>{line.notes}</Text>
                  )}
                </View>
                <Text style={[styles.tableCell, styles.colSupplier]}>
                  {line.supplier}
                </Text>
                <Text style={[styles.tableCell, styles.colBudgeted]}>
                  {formatZAR(line.budgeted)}
                </Text>
                <Text style={[styles.tableCellBold, styles.colActual]}>
                  {line.actual > 0 ? formatZAR(line.actual) : '—'}
                </Text>
                <Text
                  style={[
                    isOver ? styles.tableCellRed
                    : v < 0 ? styles.tableCellGreen
                    : styles.tableCell,
                    styles.colVariance,
                  ]}
                >
                  {line.actual > 0 ? variancePct(line.budgeted, line.actual) : '—'}
                </Text>
                <View style={styles.colStatus}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusStyle.bg },
                    ]}
                  >
                    <Text style={{ color: statusStyle.color, fontSize: 7, fontFamily: 'Helvetica-Bold' }}>
                      {STATUS_LABELS[line.status]}
                    </Text>
                  </View>
                </View>
              </View>
            )
          })}

          {/* Table bottom border */}
          <View
            style={{
              height: 1,
              backgroundColor: '#e2ddd8',
              marginTop: 0,
            }}
          />
        </View>

        {/* ── Summary block ─────────────────────────────────────────────── */}
        <View style={styles.summaryBlock}>
          <View style={styles.summaryTable}>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Budgeted (ex. VAT)</Text>
              <Text style={styles.summaryValue}>{formatZAR(totalBudgeted)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Actual Spend (ex. VAT)</Text>
              <Text style={
                totalActual > totalBudgeted
                  ? styles.summaryValueRed
                  : styles.summaryValueGreen
              }>
                {formatZAR(totalActual)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Budget Variance (
                {totalVariance >= 0
                  ? `+${variancePct(totalBudgeted, totalActual)} over`
                  : `${variancePct(totalBudgeted, totalActual)} under`}
                )
              </Text>
              <Text
                style={
                  totalVariance > 0
                    ? styles.summaryValueRed
                    : styles.summaryValueGreen
                }
              >
                {formatZAR(Math.abs(totalVariance))}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                VAT @ {(vatRate * 100).toFixed(0)}%
              </Text>
              <Text style={styles.summaryValue}>{formatZAR(vatAmount)}</Text>
            </View>

            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>TOTAL (incl. VAT)</Text>
              <Text style={styles.summaryTotalValue}>{formatZAR(grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* ── Footer (fixed, every page) ────────────────────────────────── */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            <Text style={styles.footerText}>
              {branding.companyName}
              {branding.vatNumber ? `  ·  VAT: ${branding.vatNumber}` : ''}
              {branding.address ? `  ·  ${branding.address}` : ''}
            </Text>
            {footerNote && (
              <Text style={styles.footerNote}>{footerNote}</Text>
            )}
          </View>
          <View>
            <Text
              style={styles.footerPageNum}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
            />
            <Text style={styles.footerBrand}>
              eventsaas.namka.cloud
            </Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}

// ─── Programmatic export helper ───────────────────────────────────────────────
// Use this in a server action or when you need the raw Blob (e.g. email attachment).
//
//   const blob = await generateBudgetPDF(props)
//   saveAs(blob, `budget-report-${eventName}.pdf`)

export const generateBudgetPDF = async (
  props: BudgetPDFProps,
): Promise<Blob> => {
  const blob = await pdf(<BudgetPDFDocument {...props} />).toBlob()
  return blob
}
