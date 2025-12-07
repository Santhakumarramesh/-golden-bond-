/**
 * Golden Bond - Profile Routes
 * Profile CRUD operations
 */

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { TRUST_SCORE_WEIGHTS } from '../config';

const prisma = new PrismaClient();
const router = Router();

// Profile update schema
const profileUpdateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  bodyType: z.enum(['SLIM', 'AVERAGE', 'ATHLETIC', 'HEAVY']).optional(),
  complexion: z.string().optional(),
  physicalStatus: z.string().optional(),
  bloodGroup: z.string().optional(),
  
  religion: z.string().optional(),
  community: z.string().optional(),
  subCommunity: z.string().optional(),
  gotra: z.string().optional(),
  
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  citizenship: z.string().optional(),
  residencyStatus: z.string().optional(),
  visaStatus: z.string().optional(),
  
  motherTongue: z.string().optional(),
  languagesKnown: z.array(z.string()).optional(),
  
  education: z.string().optional(),
  educationDetail: z.string().optional(),
  college: z.string().optional(),
  profession: z.string().optional(),
  company: z.string().optional(),
  income: z.string().optional(),
  workingWith: z.string().optional(),
  
  diet: z.enum(['VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'VEGAN', 'JAIN']).optional(),
  smoking: z.enum(['YES', 'NO', 'OCCASIONALLY']).optional(),
  drinking: z.enum(['YES', 'NO', 'OCCASIONALLY']).optional(),
  pets: z.string().optional(),
  hobbies: z.array(z.string()).optional(),
  
  familyType: z.enum(['NUCLEAR', 'JOINT', 'OTHER']).optional(),
  familyStatus: z.string().optional(),
  familyValues: z.string().optional(),
  nativePlace: z.string().optional(),
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
  siblings: z.string().optional(),
  
  rashi: z.string().optional(),
  nakshatra: z.string().optional(),
  manglik: z.string().optional(),
  birthTime: z.string().optional(),
  birthPlace: z.string().optional(),
  kundliAvailable: z.boolean().optional(),
  
  bio: z.string().max(2000).optional(),
  aboutFamily: z.string().max(1000).optional()
});

// Preferences update schema
const preferencesUpdateSchema = z.object({
  ageMin: z.number().min(18).max(80).optional(),
  ageMax: z.number().min(18).max(80).optional(),
  heightMin: z.string().optional(),
  heightMax: z.string().optional(),
  maritalStatusAllowed: z.array(z.enum(['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'AWAITING_DIVORCE', 'ANNULLED'])).optional(),
  religionsAllowed: z.array(z.string()).optional(),
  communitiesAllowed: z.array(z.string()).optional(),
  countriesAllowed: z.array(z.string()).optional(),
  statesAllowed: z.array(z.string()).optional(),
  educationAllowed: z.array(z.string()).optional(),
  professionAllowed: z.array(z.string()).optional(),
  incomeMin: z.string().optional(),
  dietAllowed: z.array(z.enum(['VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'VEGAN', 'JAIN'])).optional(),
  smokingAllowed: z.array(z.enum(['YES', 'NO', 'OCCASIONALLY'])).optional(),
  drinkingAllowed: z.array(z.enum(['YES', 'NO', 'OCCASIONALLY'])).optional()
});

/**
 * Calculate trust score based on verification status
 */
function calculateTrustScore(profile: any): number {
  let score = 0;
  
  if (profile.emailVerified) score += TRUST_SCORE_WEIGHTS.emailVerified;
  if (profile.phoneVerified) score += TRUST_SCORE_WEIGHTS.phoneVerified;
  if (profile.idVerified) score += TRUST_SCORE_WEIGHTS.idVerified;
  if (profile.photoVerified) score += TRUST_SCORE_WEIGHTS.photoVerified;
  if (profile.videoVerified) score += TRUST_SCORE_WEIGHTS.videoVerified;
  
  // Profile completeness
  const requiredFields = ['firstName', 'gender', 'dob', 'religion', 'country', 'education', 'profession', 'bio'];
  const completedFields = requiredFields.filter(f => profile[f]);
  const completeness = completedFields.length / requiredFields.length;
  score += Math.round(TRUST_SCORE_WEIGHTS.profileComplete * completeness);
  
  return Math.min(score, 100);
}

/**
 * GET /api/profile/me
 * Get current user's profile
 */
router.get('/me', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.userId },
      include: {
        preferences: true,
        photos: {
          orderBy: { isPrimary: 'desc' }
        }
      }
    });

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({ profile });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PUT /api/profile/me
 * Update current user's profile
 */
router.put('/me', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const validation = profileUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
      return;
    }

    const data = validation.data;

    // Update profile
    const profile = await prisma.profile.update({
      where: { userId: req.userId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        preferences: true,
        photos: true
      }
    });

    // Recalculate trust score
    const trustScore = calculateTrustScore(profile);
    if (trustScore !== profile.trustScore) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: { trustScore }
      });
      profile.trustScore = trustScore;
    }

    res.json({ 
      message: 'Profile updated successfully',
      profile 
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * PUT /api/profile/preferences
 * Update partner preferences
 */
router.put('/preferences', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const validation = preferencesUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
      return;
    }

    const data = validation.data;

    // Get profile
    const profile = await prisma.profile.findUnique({
      where: { userId: req.userId }
    });

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Update or create preferences
    const preferences = await prisma.preference.upsert({
      where: { profileId: profile.id },
      create: {
        profileId: profile.id,
        ...data
      },
      update: {
        ...data,
        updatedAt: new Date()
      }
    });

    res.json({ 
      message: 'Preferences updated successfully',
      preferences 
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * GET /api/profile/:id
 * Get another user's profile (with membership gating)
 */
router.get('/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const profileId = parseInt(req.params.id, 10);

    if (isNaN(profileId)) {
      res.status(400).json({ error: 'Invalid profile ID' });
      return;
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        photos: {
          orderBy: { isPrimary: 'desc' }
        }
      }
    });

    if (!profile || profile.profileStatus !== 'APPROVED') {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Record profile view
    const viewerProfile = await prisma.profile.findUnique({
      where: { userId: req.userId }
    });

    if (viewerProfile && viewerProfile.id !== profileId) {
      await prisma.profileView.create({
        data: {
          viewerId: viewerProfile.id,
          viewedId: profileId
        }
      }).catch(() => {}); // Ignore duplicate view errors
    }

    // Apply membership gating
    const isPremium = req.isPremium;

    if (!isPremium) {
      // Free users see limited profile
      const limitedProfile = {
        id: profile.id,
        profileCode: profile.profileCode,
        firstName: profile.firstName,
        gender: profile.gender,
        age: calculateAge(profile.dob),
        maritalStatus: profile.maritalStatus,
        religion: profile.religion,
        community: profile.community,
        country: profile.country,
        state: profile.state,
        education: profile.education,
        profession: profile.profession,
        verified: profile.verified,
        trustScore: profile.trustScore,
        // Photos are blurred for free users
        photos: profile.photos.map(p => ({
          id: p.id,
          url: p.blurredUrl || p.url,
          isPrimary: p.isPrimary,
          isBlurred: true
        })),
        // Hide detailed info
        bio: 'Upgrade to Premium to see full profile details',
        isPremiumLocked: true
      };

      res.json({ profile: limitedProfile });
      return;
    }

    // Premium users see full profile
    res.json({ 
      profile: {
        ...profile,
        age: calculateAge(profile.dob),
        isPremiumLocked: false
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * GET /api/profile/views/received
 * Get list of users who viewed my profile
 */
router.get('/views/received', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.userId }
    });

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Only premium users can see who viewed them
    if (!req.isPremium) {
      res.status(403).json({ 
        error: 'Premium membership required to see profile visitors',
        upgradeUrl: '/membership'
      });
      return;
    }

    const views = await prisma.profileView.findMany({
      where: { viewedId: profile.id },
      include: {
        viewer: {
          select: {
            id: true,
            profileCode: true,
            firstName: true,
            gender: true,
            dob: true,
            religion: true,
            country: true,
            city: true,
            photos: {
              where: { isPrimary: true },
              take: 1
            }
          }
        }
      },
      orderBy: { viewedAt: 'desc' },
      take: 50
    });

    const formattedViews = views.map(v => ({
      viewedAt: v.viewedAt,
      profile: {
        ...v.viewer,
        age: calculateAge(v.viewer.dob),
        photo: v.viewer.photos[0]?.url || null
      }
    }));

    res.json({ views: formattedViews });

  } catch (error) {
    console.error('Get views error:', error);
    res.status(500).json({ error: 'Failed to get profile views' });
  }
});

/**
 * POST /api/profile/verify/:type
 * Submit verification request
 */
router.post('/verify/:type', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { type } = req.params;
    const validTypes = ['email', 'phone', 'id', 'photo', 'video'];

    if (!validTypes.includes(type)) {
      res.status(400).json({ error: 'Invalid verification type' });
      return;
    }

    // In production, this would:
    // - Send OTP for email/phone
    // - Process uploaded documents for ID
    // - Verify selfie against profile photos
    // - Process intro video

    // For demo, we'll just mark as verified
    const updateData: any = {};
    updateData[`${type}Verified`] = true;

    const profile = await prisma.profile.update({
      where: { userId: req.userId },
      data: updateData
    });

    // Recalculate trust score
    const trustScore = calculateTrustScore(profile);
    await prisma.profile.update({
      where: { id: profile.id },
      data: { trustScore }
    });

    res.json({ 
      message: `${type} verification submitted successfully`,
      trustScore
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * Helper: Calculate age from DOB
 */
function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

export default router;

