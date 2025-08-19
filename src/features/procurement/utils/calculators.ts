import type { OrderFormValues } from './procurement.types'

export function calculateDiscount(
  discountType: 'NONE' | 'PERCENTAGE' | 'AMOUNT',
  discount: number,
  gross: number,
) {
  if (discountType === 'NONE') {
    return 0
  }
  if (discountType === 'PERCENTAGE') {
    return (gross * discount) / 100
  }
  if (discountType === 'AMOUNT') {
    return discount
  }
  return 0
}

export function calculateVatValues(
  type: OrderFormValues['vatType'],
  value: string | number,
  vat: string | number,
) {
  const netValue = typeof value === 'string' ? parseFloat(value) : value
  if (type === 'NONE') {
    return { exclusive: netValue, vatValue: 0, inclusive: netValue }
  } else if (type === 'EXCLUSIVE') {
    const convertedVat =
      typeof vat === 'string' ? parseFloat(vat) / 100 : vat / 100
    const vatValue = convertedVat * netValue
    const inclusive = vatValue + netValue
    return { exclusive: netValue, vatValue, inclusive }
  } else {
    const convertedVat =
      typeof vat === 'string' ? parseFloat(vat) / 100 : vat / 100
    const exclusive = netValue / (convertedVat + 1)
    const vatValue = netValue - exclusive
    return { exclusive, vatValue, inclusive: netValue }
  }
}
