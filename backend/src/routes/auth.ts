/**
 * Golden Bond - Authentication Routes
 * Register, Login, Logout, Refresh Token
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from '../config';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dob: z.string().transform(str => new Date(str)),
  maritalStatus: z.enum(['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'AWAITING_DIVORCE', 'ANNULLED']),
  religion: z.string().min(1, 'Religion is required'),
  community: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  state: z.string().optional(),
  motherTongue: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

/**
 * Generate JWT tokens
 */
function generateTokens(userId: number, role: string) {
  const accessToken = jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  const refreshToken = jwt.sign(
    { userId, role, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
  
  return { accessToken, refreshToken };
}

/**
 * Generate unique profile code
 */
function generateProfileCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `GB-${year}-${random}`;
}

/**
 * POST /api/auth/register
 * Register a new user with basic profile
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
      return;
    }

    const data = validation.data;

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user and profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash
        }
      });

      // Create profile
      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          profileCode: generateProfileCode(),
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          dob: data.dob,
          maritalStatus: data.maritalStatus,
          religion: data.religion,
          community: data.community,
          country: data.country,
          state: data.state,
          motherTongue: data.motherTongue,
          trustScore: 10 // Base score for registration
        }
      });

      // Create default preferences
      await tx.preference.create({
        data: {
          profileId: profile.id,
          ageMin: 18,
          ageMax: 60,
          religionsAllowed: ['Any'],
          countriesAllowed: ['Any']
        }
      });

      return { user, profile };
    });

    // Generate tokens
    const tokens = generateTokens(result.user.id, result.user.role);

    res.status(201).json({
      message: 'Registration successful',
      userId: result.user.id,
      profileId: result.profile.id,
      profileCode: result.profile.profileCode,
      ...tokens
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
      return;
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: {
          select: {
            id: true,
            profileCode: true,
            firstName: true,
            lastName: true
          }
        },
        membership: {
          include: { plan: true }
        }
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check status
    if (user.status === 'BLOCKED') {
      res.status(403).json({ error: 'Account has been blocked' });
      return;
    }

    if (user.status === 'DELETED') {
      res.status(403).json({ error: 'Account has been deleted' });
      return;
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate tokens
    const tokens = generateTokens(user.id, user.role);

    // Determine membership status
    let isPremium = false;
    let membershipPlan = 'FREE';
    
    if (user.membership && user.membership.status === 'ACTIVE') {
      const now = new Date();
      if (user.membership.endDate > now) {
        isPremium = true;
        membershipPlan = user.membership.plan.slug;
      }
    }

    res.json({
      message: 'Login successful',
      userId: user.id,
      profile: user.profile,
      role: user.role,
      isPremium,
      membershipPlan,
      ...tokens
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    // Verify refresh token
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      userId: number;
      role: string;
      type: string;
    };

    if (payload.type !== 'refresh') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    // Check user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    // Generate new tokens
    const tokens = generateTokens(user.id, user.role);

    res.json({
      message: 'Token refreshed',
      ...tokens
    });

  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client should delete tokens)
 */
router.post('/logout', requireAuth, async (req: AuthedRequest, res: Response) => {
  // In a production app, you might want to:
  // - Add the token to a blacklist
  // - Invalidate refresh tokens in the database
  
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            profileCode: true,
            firstName: true,
            lastName: true,
            gender: true,
            verified: true,
            trustScore: true,
            profileStatus: true
          }
        },
        membership: {
          select: {
            status: true,
            startDate: true,
            endDate: true,
            plan: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user,
      isPremium: req.isPremium,
      membershipPlan: req.membershipPlan
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
router.post('/change-password', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash and update new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash: newPasswordHash }
    });

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;

