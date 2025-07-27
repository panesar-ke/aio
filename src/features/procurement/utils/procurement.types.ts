import type z from 'zod'
import type {
  getMaterialRequisitions,
  getRequisition,
} from '@/features/procurement/services/server-fns'
import type {
  materialRequisitionFormSchema,
  orderSchema,
} from '@/features/procurement/utils/schemas'
import type {
  getPendingRequests,
  getPurchaseOrder,
  getPurchaseOrders,
} from '@/features/procurement/services/orders/server-fns'
import type { UseFormReturn } from 'react-hook-form'

export type MaterialRequisitionTableRow = Awaited<
  ReturnType<typeof getMaterialRequisitions>
>[number]
export type MaterialRequisitionFormValues = z.infer<
  typeof materialRequisitionFormSchema
>

export type Requisition = Awaited<ReturnType<typeof getRequisition>>

export type OrderTableRow = Awaited<
  ReturnType<typeof getPurchaseOrders>
>[number]
export type OrderFormValues = z.infer<typeof orderSchema>
export type PendingOrder = Awaited<
  ReturnType<typeof getPendingRequests>
>[number]
export interface OrderForm {
  form: UseFormReturn<OrderFormValues>
}

export type Order = Awaited<ReturnType<typeof getPurchaseOrder>>

interface OrderItem {
  itemName: string
  unit: string
  quantity: number
  unitPrice: number
  discount: number
  totalPrice: number
}

export interface OrderData {
  orderNumber: string
  orderDate: Date
  supplierName: string
  supplierAddress?: string | null
  supplierEmail?: string | null
  supplierPhone?: string | null
  contactPerson?: string | null
  taxPin?: string | null
  vatType: OrderFormValues['vatType']
  vatRate: number
  items: Array<OrderItem>
  userName: string
}
