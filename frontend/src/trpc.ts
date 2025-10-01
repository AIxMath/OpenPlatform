import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@open-platform/backend/router'; 

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000',
    }),
  ],
});
