import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';
import { UserRole } from '../service/user.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * JWT载荷接口
 */
export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
}

/**
 * 生成JWT token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * 从请求头中提取token
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  // 支持 "Bearer <token>" 格式
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
}

