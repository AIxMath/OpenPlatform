import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone'
import type { JWTPayload } from './middleware/auth.js'
import { initTRPC, TRPCError } from '@trpc/server'
import { extractToken, verifyToken } from './middleware/auth.js'
import { UserRole } from './service/user.js'

/**
 * 上下文类型定义
 */
export interface Context {
  user?: JWTPayload
}

/**
 * 创建上下文
 */
export async function createContext(opts: CreateHTTPContextOptions): Promise<Context> {
  const authHeader = opts.req.headers.authorization
  const token = extractToken(authHeader)

  if (token) {
    try {
      const user = verifyToken(token)
      return { user }
    }
    catch (error) {
      // Token无效，返回空上下文
      return {}
    }
  }

  return {}
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

/**
 * 需要认证的procedure
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  })
})

/**
 * 需要管理员权限的procedure
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }

  if (ctx.user.role !== UserRole.ADMIN) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource',
    })
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  })
})
