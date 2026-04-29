'use client';

import {
  Building2,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Key,
  Minus,
  RefreshCw,
  StickyNote,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Renewal {
  id: string;
  vendorName: string;
  licenseKey: string | null;
  totalSeats: number;
  usedSeats: number;
  startDate: string | null;
  endDate: string | null;
  renewalCost: string | null;
  renewalDate: string | null;
  notes: string | null;
  createdAt: string;
}

interface Props {
  renewals: Array<Renewal>;
}

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtYear(d: string | null) {
  if (!d) return '—';
  return new Date(d).getFullYear().toString();
}

function getRenewalYear(renewal: Renewal) {
  return fmtYear(renewal.startDate ?? renewal.createdAt);
}

function fmtCost(v: string | null) {
  if (!v) return '—';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(Number(v));
}

function seatPct(used: number, total: number) {
  return total === 0 ? 0 : Math.round((used / total) * 100);
}

function costDelta(curr: string | null, prev: string | null) {
  if (!curr || !prev) return null;
  const c = Number(curr);
  const p = Number(prev);
  if (p === 0) return null;
  return Math.round(((c - p) / p) * 100);
}

function seatDelta(curr: number, prev: number | null) {
  if (prev === null) return null;
  return curr - prev;
}

function SeatBar({ used, total }: { used: number; total: number }) {
  const pct = seatPct(used, total);
  const color =
    pct >= 100 ? 'bg-red-500' : pct >= 85 ? 'bg-amber-500' : 'bg-teal-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', color)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
        {used}/{total} ({pct}%)
      </span>
    </div>
  );
}

function DeltaPill({
  value,
  unit = '',
  inverse = false,
}: {
  value: number;
  unit?: string;
  inverse?: boolean;
}) {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNeutral = value === 0;

  if (isNeutral)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" /> No change
      </span>
    );

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        isPositive ? 'text-emerald-600' : 'text-red-500',
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {value > 0 ? '+' : ''}
      {value}
      {unit}
    </span>
  );
}

function RenewalCard({
  renewal,
  prev,
  isLatest,
}: {
  renewal: Renewal;
  prev: Renewal | null;
  isLatest: boolean;
}) {
  const [expanded, setExpanded] = useState(isLatest);

  const costDiff = costDelta(renewal.renewalCost, prev?.renewalCost ?? null);
  const seatDiff = seatDelta(renewal.totalSeats, prev?.totalSeats ?? null);
  const vendorChanged = prev && prev.vendorName !== renewal.vendorName;
  const pct = seatPct(renewal.usedSeats, renewal.totalSeats);

  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-card overflow-hidden',
        isLatest && 'ring-2 ring-teal-500/40 shadow-sm',
      )}
    >
      {isLatest && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-teal-600 hover:bg-teal-600 text-white text-[10px] font-medium px-2 py-0.5">
            Latest
          </Badge>
        </div>
      )}

      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-5 pt-4 pb-4 flex flex-col gap-3"
      >
        <div className="flex items-start gap-0 pr-16 flex-col">
          <span className="text-base font-semibold leading-tight">
            {getRenewalYear(renewal)} Renewal
          </span>
          <span className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            {renewal.vendorName}
            {vendorChanged && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50 ml-1"
              >
                Vendor changed
              </Badge>
            )}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-muted/60 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">
              Cost
            </p>
            <p className="text-sm font-semibold tabular-nums leading-tight">
              {fmtCost(renewal.renewalCost)}
            </p>
            {prev && costDiff !== null && (
              <div className="mt-1">
                <DeltaPill value={costDiff} unit="%" inverse />
              </div>
            )}
          </div>

          <div className="rounded-xl bg-muted/60 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">
              Seats
            </p>
            <p className="text-sm font-semibold leading-tight">
              {renewal.totalSeats.toLocaleString()}
            </p>
            {prev && seatDiff !== null && (
              <div className="mt-1">
                <DeltaPill value={seatDiff} unit=" seats" />
              </div>
            )}
          </div>

          <div className="rounded-xl bg-muted/60 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">
              Utilization
            </p>
            <p
              className={cn(
                'text-sm font-semibold leading-tight',
                pct >= 100
                  ? 'text-red-600'
                  : pct >= 85
                    ? 'text-amber-600'
                    : 'text-teal-600',
              )}
            >
              {pct}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {renewal.usedSeats} used
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Hide details
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Show details
            </>
          )}
        </div>
      </button>

      {expanded && (
        <>
          <Separator />
          <div className="px-5 py-4 space-y-3.5 text-sm">
            <div className="flex items-start gap-3">
              <CalendarRange className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  Coverage period
                </p>
                <p className="font-medium">
                  {fmt(renewal.startDate)} – {fmt(renewal.endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  Renewal actioned on
                </p>
                <p className="font-medium">{fmt(renewal.renewalDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1.5">
                  Seat utilization
                </p>
                <SeatBar used={renewal.usedSeats} total={renewal.totalSeats} />
              </div>
            </div>

            {renewal.licenseKey && (
              <div className="flex items-start gap-3">
                <Key className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    License key
                  </p>
                  <p className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md truncate">
                    {renewal.licenseKey}
                  </p>
                </div>
              </div>
            )}

            {renewal.notes && (
              <div className="flex items-start gap-3">
                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Notes</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {renewal.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryStrip({ renewals }: { renewals: Array<Renewal> }) {
  const sorted = [...renewals].sort(
    (a, b) =>
      new Date(b.startDate ?? b.createdAt).getTime() -
      new Date(a.startDate ?? a.createdAt).getTime(),
  );

  const latest = sorted[0];
  const oldest = sorted[sorted.length - 1];
  const totalSpend = renewals.reduce(
    (s, r) => s + Number(r.renewalCost ?? 0),
    0,
  );
  const years =
    oldest && latest
      ? new Date(latest.startDate ?? latest.createdAt).getFullYear() -
        new Date(oldest.startDate ?? oldest.createdAt).getFullYear() +
        1
      : 1;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          icon: RefreshCw,
          label: 'Total renewals',
          value: renewals.length,
          sub: `over ${years} yr${years !== 1 ? 's' : ''}`,
        },
        {
          icon: DollarSign,
          label: 'Cumulative spend',
          value: fmtCost(String(totalSpend)),
          sub: 'all cycles',
        },
        {
          icon: Users,
          label: 'Current seats',
          value: latest?.totalSeats.toLocaleString() ?? '—',
          sub: `${seatPct(latest?.usedSeats ?? 0, latest?.totalSeats ?? 1)}% utilization`,
        },
        {
          icon: Building2,
          label: 'Current vendor',
          value: latest?.vendorName ?? '—',
          sub: latest ? `${getRenewalYear(latest)} cycle` : '—',
        },
      ].map(({ icon: Icon, label, value, sub }) => (
        <div
          key={label}
          className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3"
        >
          <div className="rounded-lg bg-teal-50 p-2 shrink-0">
            <Icon className="h-4 w-4 text-teal-700" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium leading-none mb-1">
              {label}
            </p>
            <p className="text-sm font-semibold leading-tight truncate">
              {value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LicenseRenewalHistory({ renewals }: Props) {
  const sorted = [...renewals].sort(
    (a, b) =>
      new Date(b.startDate ?? b.createdAt).getTime() -
      new Date(a.startDate ?? a.createdAt).getTime(),
  );

  const prevMap = new Map<string, Renewal | null>();
  sorted.forEach((r, i) => {
    prevMap.set(r.id, sorted[i + 1] ?? null);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <SummaryStrip renewals={renewals} />

      {sorted.length === 0 ? (
        <div className="rounded-2xl border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          No renewals recorded yet.
        </div>
      ) : (
        <div className="relative">
          <div
            className="absolute left-[19px] top-5 bottom-5 w-px bg-border"
            aria-hidden
          />

          <div className="space-y-5">
            {sorted.map((renewal, idx) => (
              <div key={renewal.id} className="flex gap-4">
                <div className="shrink-0 pt-[14px]">
                  <div
                    className={cn(
                      'w-[38px] h-[38px] rounded-full border-2 flex items-center justify-center z-10 relative bg-background text-xs font-bold tabular-nums',
                      idx === 0
                        ? 'border-teal-500 text-teal-600'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {getRenewalYear(renewal)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <RenewalCard
                    renewal={renewal}
                    prev={prevMap.get(renewal.id) ?? null}
                    isLatest={idx === 0}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
