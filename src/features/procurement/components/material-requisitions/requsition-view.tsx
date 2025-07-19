import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { FileScanIcon, PrinterIcon, SparkleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { materialRequisitionsQueryOptions } from '@/features/procurement/utils/query-options'
import { NotFound } from '@/components/custom/error-components'
import { Skeleton } from '@/components/ui/skeleton'
import { ButtonLoader } from '@/components/custom/loaders'
import axios from '@/lib/axios'
import { toast } from 'sonner'
import { apiErrorHandler } from '@/lib/utils'
import type { AxiosResponse } from 'axios'
import { updateRequisitionUrl } from '@/features/procurement/services/server-fns'

type RequisitionData = {
  documentDate: string
  requisitionNumber: string
  items: {
    itemName: string
    quantity: string
    unit: string
    rate: number | string
    project: string
  }[]
}

async function generateFile(data: RequisitionData) {
  try {
  } catch (error) {
    throw new Error(apiErrorHandler(error))
  }
}

export function RequisitionView({ requisitionId }: { requisitionId: string }) {
  const { data } = useSuspenseQuery(
    materialRequisitionsQueryOptions.requisition(requisitionId),
  )
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (values: RequisitionData) => {
      const res: AxiosResponse<{
        success: boolean
        message: string
        url: string
      }> = await axios.post(`/api/generate-requisition`, values)

      await updateRequisitionUrl({
        data: { fileUrl: res.data.url, requisitionId },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['material_requisitions', requisitionId],
      })
    },
    onError: (error) => {
      toast.error(apiErrorHandler(error))
    },
  })

  if (!data) {
    return <NotFound />
  }

  const handleGenerateFile = () => {
    const formattedData = {
      documentDate: data.documentDate,
      requisitionNumber: data.id.toString(),
      items: data.mrqDetails.map(
        ({ product, service, project, itemId, qty }) => ({
          itemName: itemId ? product?.productName! : service?.serviceName!,
          quantity: qty,
          unit: itemId ? product?.uom?.abbreviation! : 'DEF',
          rate: itemId
            ? (product?.buyingPrice ?? 0)
            : (service?.serviceFee ?? 0),
          project: project.projectName,
        }),
      ),
    }
    mutate(formattedData)
  }

  return (
    <div className="flex items-center gap-2">
      {!data.fileUrl ? (
        <Button size="lg" onClick={handleGenerateFile} disabled={isPending}>
          {!isPending ? (
            <>
              <FileScanIcon />
              <span>Generate</span>
            </>
          ) : (
            <ButtonLoader loadingText="Generating..." />
          )}
        </Button>
      ) : (
        <Button size="lg" asChild>
          <a href={data.fileUrl} target="_blank">
            <PrinterIcon />
            <span>Print</span>
          </a>
        </Button>
      )}
      {data.mrqDetails.filter((d) => d.linked).length === 0 && (
        <Button variant="tertiary" size="lg" disabled={isPending}>
          <SparkleIcon />
          Generate LPO
        </Button>
      )}
    </div>
    //TODO: SET REQ TABLE
  )
}

export function RequisitionSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-48" />
    </div>
  )
}
