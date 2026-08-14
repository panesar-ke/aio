'use client';

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import type {
  SaleOrderDetailLine,
  SaleOrderDetails,
} from '@/features/sales/utils/sales.types';

import {
  formatSaleOrderAmount,
  formatSaleOrderNo,
} from '@/features/sales/utils/sale-order-format';
import { summariseSaleOrder } from '@/features/sales/utils/sale-order-summary';
import { dateFormat, numberFormat, titleCase } from '@/lib/helpers/formatters';

const COLORS = {
  text: '#1a1a1a',
  muted: '#6b7280',
  border: '#e5e7eb',
  headerBg: '#f5f5f4',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 9,
    color: COLORS.text,
    fontFamily: 'Helvetica',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: { width: 120 },
  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  docMeta: {
    fontSize: 9,
    color: COLORS.muted,
    textAlign: 'right',
    marginTop: 4,
  },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: 16,
    marginBottom: 16,
  },
  partiesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  party: { width: '48%' },
  partyLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: 5,
  },
  partyName: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  partyLine: { color: COLORS.muted, marginBottom: 2 },
  table: { marginTop: 20 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.headerBg,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.muted,
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  colIndex: { width: '5%' },
  colItem: { width: '37%' },
  colCategory: { width: '18%' },
  colQty: { width: '10%', textAlign: 'right' },
  colRate: { width: '15%', textAlign: 'right' },
  colGross: { width: '15%', textAlign: 'right' },
  totalsWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  totals: { width: '45%' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: { color: COLORS.muted },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  grandTotalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 11 },
  grandTotalValue: { fontFamily: 'Helvetica-Bold', fontSize: 11 },
  cancelled: {
    marginTop: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    color: '#dc2626',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 7,
    color: COLORS.muted,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
});

const VAT_TYPE_LABELS = {
  NONE: 'None',
  EXCLUSIVE: 'Exclusive',
  INCLUSIVE: 'Inclusive',
} as const;

type SaleOrderPdfDocumentProps = {
  order: SaleOrderDetails['order'];
  lines: Array<SaleOrderDetailLine>;
};

export function SaleOrderPdfDocument({
  order,
  lines,
}: SaleOrderPdfDocumentProps) {
  const summary = summariseSaleOrder(order, lines);
  const orderNo = formatSaleOrderNo(order.saleOrderNo, order.dateRaised);
  const company = order.company ? titleCase(order.company.toLowerCase()) : '—';
  const money = (value: number) => formatSaleOrderAmount(order.currency, value);

  return (
    <Document
      title={orderNo}
      subject={`Sales order for ${company}`}
      author='Panesar Kenya Limited'
    >
      <Page size='A4' style={styles.page}>
        <View style={styles.topBar}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop */}
          <Image style={styles.logo} src='/logos/logo-black.png' />
          <View>
            <Text style={styles.docTitle}>SALES ORDER</Text>
            <Text style={styles.docMeta}>{orderNo}</Text>
            <Text style={styles.docMeta}>
              {dateFormat(order.dateRaised, 'reporting')}
            </Text>
          </View>
        </View>

        <View style={styles.rule} />

        <View style={styles.partiesRow}>
          <View style={styles.party}>
            <Text style={styles.partyLabel}>BILL TO</Text>
            <Text style={styles.partyName}>{company}</Text>
            {order.kraPin ? (
              <Text style={styles.partyLine}>KRA PIN: {order.kraPin}</Text>
            ) : null}
            {order.phone ? (
              <Text style={styles.partyLine}>{order.phone}</Text>
            ) : null}
            {order.email ? (
              <Text style={styles.partyLine}>{order.email}</Text>
            ) : null}
          </View>
          <View style={styles.party}>
            <Text style={styles.partyLabel}>ORDER DETAILS</Text>
            <Text style={styles.partyLine}>
              Sales Person: {titleCase(order.salesRepName.toLowerCase())}
            </Text>
            <Text style={styles.partyLine}>
              VAT Type: {VAT_TYPE_LABELS[order.vatType]}
            </Text>
            {order.vatType !== 'NONE' ? (
              <Text style={styles.partyLine}>VAT Rate: {order.vatRate}%</Text>
            ) : null}
            <Text style={styles.partyLine}>Currency: {order.currency}</Text>
            {order.currency !== 'KES' ? (
              <Text style={styles.partyLine}>
                Exchange Rate: {numberFormat(order.conversionRate)}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableHeaderCell, styles.colIndex]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colItem]}>ITEM</Text>
            <Text style={[styles.tableHeaderCell, styles.colCategory]}>
              CATEGORY
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>QTY</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>RATE</Text>
            <Text style={[styles.tableHeaderCell, styles.colGross]}>GROSS</Text>
          </View>
          {lines.map((line, index) => (
            <View key={line.id} style={styles.tableRow} wrap={false}>
              <Text style={styles.colIndex}>{index + 1}</Text>
              <Text style={styles.colItem}>{line.item}</Text>
              <Text style={styles.colCategory}>
                {line.category ? titleCase(line.category) : '—'}
              </Text>
              <Text style={styles.colQty}>{numberFormat(line.qty, 0)}</Text>
              <Text style={styles.colRate}>{numberFormat(line.rate)}</Text>
              <Text style={styles.colGross}>{numberFormat(line.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsWrap}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Items</Text>
              <Text>{numberFormat(summary.totalItems, 0)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Gross Value</Text>
              <Text>{money(summary.grossTotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Exclusive</Text>
              <Text>{money(summary.exclusive)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>VAT</Text>
              <Text>{money(summary.vatAmount)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                {money(summary.inclusive)}
              </Text>
            </View>
          </View>
        </View>

        {order.status === 'cancelled' ? (
          <Text style={styles.cancelled}>THIS ORDER HAS BEEN CANCELLED</Text>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>
            {orderNo} · Raised {dateFormat(order.dateRaised, 'reporting')}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
