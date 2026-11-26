'use client';

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import { type LeaveBalance } from '@/features/human-resources/utils/leave/balance';
import {
  formatLeaveDate,
  type LeaveRow,
} from '@/features/human-resources/utils/leave/leave.types';

const BOLD = 'Helvetica-Bold';
const INK = '#0b1020';
const RULE = '#374151';

const styles = StyleSheet.create({
  page: {
    paddingVertical: 28,
    paddingHorizontal: 28,
    fontFamily: 'Helvetica',
    fontSize: 11.5,
    color: INK,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontFamily: BOLD, fontSize: 23, marginLeft: 7 },
  logo: { width: 110 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  grow: { flex: 1, paddingRight: 16 },
  label: { fontFamily: BOLD },
  upper: { textTransform: 'uppercase' },
  rule: { borderBottomWidth: 2, borderBottomColor: RULE, marginBottom: 16 },
  balance: { paddingLeft: 55, paddingTop: 4, marginBottom: 4 },
  balanceRow: { flexDirection: 'row', marginBottom: 12 },
  balanceLabel: { width: 217 },
  heading: { fontFamily: BOLD, fontSize: 13, marginBottom: 18 },
  signatures: { flexDirection: 'row' },
  signatory: { width: 185.5 },
  signatureLine: {
    width: 116,
    borderBottomWidth: 2,
    borderBottomColor: RULE,
    marginTop: 20,
    marginBottom: 16,
  },
});

const SIGNATORIES = ['Supervisor', 'Human Resources', 'Director'];

/** `Label: value` as one run of text, so long values wrap. */
function Entry({
  label,
  value,
  upper = false,
}: {
  label: string;
  value: string;
  upper?: boolean;
}) {
  return (
    // Wrap between words only, never by hyphenating them.
    <Text hyphenationCallback={(word) => [word]}>
      <Text style={styles.label}>{label}: </Text>
      <Text style={upper ? styles.upper : undefined}> {value}</Text>
    </Text>
  );
}

export function LeavePdfDocument({
  leave,
  balance,
  logoSrc = '/logos/logo-black.png',
}: {
  leave: LeaveRow;
  balance: LeaveBalance | null;
  logoSrc?: string;
}) {
  const days = `${leave.daysTaken} ${leave.daysTaken === 1 ? 'day' : 'days'}`;

  const balanceRows = balance
    ? [
        ['Leave due this year', balance.due],
        ['Leave taken this year', balance.taken],
        ['Balance due', balance.balance],
        ['Leave now being applied for', balance.applied],
        ['Leave due carried forward', balance.carriedForward],
      ]
    : [];

  return (
    <Document
      title={`Leave Application ${leave.leaveNo}`}
      author='Panesar Kenya Limited'
    >
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Leave Application</Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop */}
          <Image style={styles.logo} src={logoSrc} />
        </View>

        <View style={styles.row}>
          <View style={styles.grow}>
            <Entry label='FROM' value={leave.employeeName} upper />
          </View>
          <Entry label='Date' value={formatLeaveDate(leave.applicationDate)} />
        </View>
        <View style={styles.row}>
          <Entry label='TO' value='Human Resources Manager' upper />
        </View>
        <View style={styles.rule} />

        <View style={styles.row}>
          <Text>I would like to take {days}</Text>
        </View>
        <View style={styles.row}>
          <Entry label='FROM' value={formatLeaveDate(leave.startDate)} upper />
          <Entry label='TO' value={formatLeaveDate(leave.endDate)} />
        </View>
        <View style={styles.row}>
          <View style={styles.grow}>
            <Entry label='REASON' value={leave.reason || '—'} upper />
          </View>
          <Entry
            label='RESUME WORK ON'
            value={formatLeaveDate(leave.resumeDate)}
          />
        </View>
        <View style={styles.rule} />

        {balance && (
          <>
            <View style={styles.balance}>
              {balanceRows.map(([label, value]) => (
                <View key={label} style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>{label}</Text>
                  <Text style={styles.label}>{value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.rule} />
          </>
        )}

        <View wrap={false}>
          <Text style={styles.heading}>Approval</Text>
          <View style={styles.signatures}>
            {SIGNATORIES.map((signatory) => (
              <View key={signatory} style={styles.signatory}>
                <Text>{signatory}</Text>
                <View style={styles.signatureLine} />
                <Text>Date</Text>
                <View style={styles.signatureLine} />
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
