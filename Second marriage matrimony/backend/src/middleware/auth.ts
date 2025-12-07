/**
 * Golden Bond - Authentication Middleware
 * JWT verification and user context
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JWT_SECRET } from '../config';

const prisma = new PrismaClient();

// Extended Request interface with user context
export interface AuthedRequest extends Request {
  userId?: number;
  userRole?: string;
  isPremium?: boolean;
  membershipPlan?: string;
}

// JWT Payload interface
interface JWTPayload {
  userId: number;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Require authentication - blocks unauthenticated requests
 */
export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      // Get user with membership info
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          membership: {
            include: { plan: true }
          }
        }
      });

      if (!user || user.status !== 'ACTIVE') {
        res.status(401).json({ error: 'User not found or inactive' });
        return;
      }

      // Set user context
      req.userId = user.id;
      req.userRole = user.role;
      
      // Check membership status
      if (user.membership && user.membership.status === 'ACTIVE') {
        const now = new Date();
        if (user.membership.endDate > now) {
          req.isPremium = true;
          req.membershipPlan = user.membership.plan.slug;
        } else {
          req.isPremium = false;
          req.membershipPlan = 'FREE';
        }
      } else {
        req.isPremium = false;
        req.membershipPlan = 'FREE';
      }

      next();
    } catch (jwtError) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication - allows unauthenticated but adds user context if token present
 */
export async function optionalAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      // No token, continue as guest
      req.isPremium = false;
      req.membershipPlan = 'FREE';
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          membership: {
            include: { plan: true }
          }
        }
      });

      if (user && user.status === 'ACTIVE') {
        req.userId = user.id;
        req.userRole = user.role;
        
        if (user.membership && user.membership.status === 'ACTIVE') {
          const now = new Date();
          if (user.membership.endDate > now) {
            req.isPremium = true;
            req.membershipPlan = user.membership.plan.slug;
          } else {
            req.isPremium = false;
            req.membershipPlan = 'FREE';
          }
        } else {
          req.isPremium = false;
          req.membershipPlan = 'FREE';
        }
      }
    } catch {
      // Invalid token, continue as guest
      req.isPremium = false;
      req.membershipPlan = 'FREE';
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
}

/**
 * Require admin role
 */
export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, () => {
    if (req.userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}

/**
 * Require premium membership
 */
export function requirePremium(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.isPremium) {
    res.status(403).json({ 
      error: 'Premium membership required',
      upgradeUrl: '/membership'
    });
    return;
  }
  next();
}

