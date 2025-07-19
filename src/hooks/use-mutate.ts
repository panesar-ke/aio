import { useMutation } from '@tanstack/react-query'

export function useMutate<T>(
  createFn: (values: T) => Promise<void>,
  id?: string,
  updateFn?: (resourceId: string, values: T) => Promise<void>,
) {
  const isEdit = !!id

  const { isPending, mutate } = useMutation({
    mutationFn: (values: T) => {
      if (!isEdit) {
        return createFn(values)
      } else {
        if (updateFn) {
          if (!id) throw new Error('Member id not found')
          return updateFn(id, values)
        }
        return Promise.resolve()
      }
    },
  })

  return { isPending, mutate }
}
