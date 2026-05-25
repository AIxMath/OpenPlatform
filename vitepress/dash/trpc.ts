import type { AppRouter } from '../../backend/src/router'
import { createTRPCClient, httpBatchLink } from '@trpc/client'

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api',
      headers() {
        const token = localStorage.getItem('auth_token')
        return token ? { Authorization: `Bearer ${token}` } : {}
      },
    }),
  ],
})
