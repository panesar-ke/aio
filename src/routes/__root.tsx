import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import TanStackQueryLayout from '../integrations/tanstack-query/layout.tsx'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

import type { TRPCRouter } from '@/integrations/trpc/router'
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { useAppSession } from '@/lib/session.ts'
import { ErrorComponent } from '@/components/custom/error-components.tsx'
import { FullPageLoader } from '@/components/custom/loaders.tsx'

interface MyRouterContext {
  queryClient: QueryClient

  trpc: TRPCOptionsProxy<TRPCRouter>
}

const fetchUser = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await useAppSession()

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!session.data) {
    return null
  }

  return session.data
})

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    const user = await fetchUser()

    return {
      user,
    }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'PKL - AIO',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/logos/favicon-black.svg',
      },
    ],
  }),

  component: () => (
    <RootDocument>
      <Outlet />
      <TanStackRouterDevtools />

      <TanStackQueryLayout />
    </RootDocument>
  ),
  errorComponent: ({ error }) => <ErrorComponent message={error.message} />,
  pendingComponent: () => <FullPageLoader />,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
