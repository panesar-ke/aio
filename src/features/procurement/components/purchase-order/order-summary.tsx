import type { OrderForm } from '@/features/procurement/utils/procurement.types'
import { numberFormat } from '@/lib/helpers/formatters'
import { useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import { calculateVatValues } from '../../utils/calculators'

interface OrderSummaryProps {
  form: OrderForm['form']
}

interface SummaryRow {
  label: string
  value: string | number
  isTotal?: boolean
}

export function OrderSummary({ form }: OrderSummaryProps) {
  const [vatType, vat, details] = useWatch({
    control: form.control,
    name: ['vatType', 'vat', 'details'],
  })

  const calculations = useMemo(() => {
    if (!details?.length) {
      return {
        totalItems: 0,
        grossTotal: 0,
        discountedAmount: 0,
        discount: 0,
      }
    }

    let totalItems = 0
    let grossTotal = 0
    let discountedAmount = 0

    for (const item of details) {
      const qty = Number(item.qty) || 0
      const rate = Number(item.rate) || 0
      const itemTotal = qty * rate

      totalItems += qty
      grossTotal += itemTotal

      const itemDiscountValue =
        item.discountType === 'PERCENTAGE'
          ? itemTotal * (Number(item.discount || 0) / 100)
          : Number(item.discount || 0)

      discountedAmount += itemTotal - itemDiscountValue
    }

    const discount = grossTotal - discountedAmount

    return {
      totalItems,
      grossTotal,
      discountedAmount,
      discount,
    }
  }, [details])

  const vatValues = useMemo(
    () =>
      calculateVatValues(
        vatType,
        calculations.discountedAmount,
        Number(vat) || 0,
      ),
    [vatType, calculations.discountedAmount, vat],
  )

  const summaryRows: Array<SummaryRow> = useMemo(
    () => [
      {
        label: 'Total Items',
        value: calculations.totalItems,
      },
      {
        label: 'Gross Value',
        value: `Ksh ${numberFormat(calculations.grossTotal)}`,
      },
      {
        label: 'Discounted Amount',
        value:
          calculations.discount > 0
            ? `Ksh ${numberFormat(calculations.discount)}`
            : '0.00',
      },
      {
        label: 'SubTotal',
        value: `Ksh ${numberFormat(calculations.discountedAmount)}`,
      },
      {
        label: 'Amount Exclusive',
        value: `Ksh ${numberFormat(vatValues.exclusive)}`,
      },
      {
        label: 'VAT',
        value: `Ksh ${numberFormat(vatValues.vatValue)}`,
      },
      {
        label: 'Amount Inclusive',
        value: `Ksh ${numberFormat(vatValues.inclusive)}`,
        isTotal: true,
      },
    ],
    [calculations, vatValues],
  )

  return (
    <div className="w-96 shadow-none border p-4 rounded-lg space-y-4 bg-card">
      <h3 className="text-lg font-semibold mb-4 font-display text-primary border-b pb-2">
        Order Summary
      </h3>

      <div className="space-y-3">
        {summaryRows.map((row, index) => (
          <SummaryRow
            key={row.label}
            label={row.label}
            value={row.value}
            isTotal={row.isTotal}
            isLast={index === summaryRows.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

interface SummaryRowProps {
  label: string
  value: string | number
  isTotal?: boolean
  isLast?: boolean
}

function SummaryRow({ label, value, isTotal, isLast }: SummaryRowProps) {
  return (
    <div
      className={`
      grid grid-cols-2 gap-4 text-sm py-2
      ${isTotal ? 'border-t pt-3 font-semibold text-base' : ''}
      ${isLast ? 'border-b-0' : 'border-b border-border/50'}
    `}
    >
      <p className={isTotal ? 'font-semibold' : ''}>{label}:</p>
      <p
        className={`text-right ${isTotal ? 'font-bold text-primary' : 'font-semibold'}`}
      >
        {value}
      </p>
    </div>
  )
}
