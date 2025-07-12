import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface TableSkeletonProps {
  rowCount: number
  columnWidths: Array<string>
}

export function TableSkeleton({ rowCount, columnWidths }: TableSkeletonProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columnWidths.map((_, index) => (
            <TableHead key={`th-${index}`}>
              <Skeleton
                className={`h-4 ${columnWidths[index]}`}
                aria-hidden="true"
              />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <TableRow key={`row-${rowIndex}`}>
            {columnWidths.map((width, colIndex) => (
              <TableCell key={`row-${rowIndex}-col-${colIndex}`}>
                <Skeleton className={`h-4 ${width}`} aria-hidden="true" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function TableSkeletonWithButton({
  rowCount,
  columnWidths,
}: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-36" />
      <TableSkeleton rowCount={rowCount} columnWidths={columnWidths} />
    </div>
  )
}
