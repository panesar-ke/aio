import { wrapVinxiConfigWithSentry } from '@sentry/tanstackstart-react'
import config from 'vite.config'
import { env } from '@/env/server'

export default wrapVinxiConfigWithSentry(config, {
  org: 'pkl-13',
  project: 'javascript-tanstackstart-react',
  authToken: env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  // Set to `true` to suppress logs
  silent: !process.env.CI,
})
