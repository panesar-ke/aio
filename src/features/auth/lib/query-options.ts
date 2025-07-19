import { queryOptions } from '@tanstack/react-query'
import { getForms } from '@/features/auth/server-functions'

export const authQueryOptions = {
  userForms: () =>
    queryOptions({
      queryKey: ['forms'],
      queryFn: getForms,
    }),
}
