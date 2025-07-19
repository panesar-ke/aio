import type z from 'zod'
import type {
  getMaterialRequisitions,
  getRequisition,
} from '@/features/procurement/services/server-fns'
import type { materialRequisitionFormSchema } from '@/features/procurement/utils/schemas'

export type MaterialRequisitionTableRow = Awaited<
  ReturnType<typeof getMaterialRequisitions>
>[number]
export type MaterialRequisitionFormValues = z.infer<
  typeof materialRequisitionFormSchema
>

export type Requisition = Awaited<ReturnType<typeof getRequisition>>
