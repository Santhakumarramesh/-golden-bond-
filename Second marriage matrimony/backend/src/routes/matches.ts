/**
 * Golden Bond - Matches Routes
 * AI-powered match recommendations and interest management
 */

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { 
  computeCompatibility, 
  getBreakdownPercentages,
  ProfileWithPref,
  calculateAge 
} from '../services/matchEngine';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/matches/recommended
 * Get AI-recommended matches based on compatibility
 */
router.get('/recommended', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    // Get user's profile with preferences
    const userProfile = await prisma.profile.findUnique({
      where: { userId: req.userId },
      include: { preferences: true }
    });

    if (!userProfile) {
      res.status(404).json({ error: 'Profile not found. Please complete your profile first.' });
      return;
    }

    // Determine opposite gender (for heterosexual matching - can be expanded)
    const targetGender = userProfile.gender === 'MALE' ? 'FEMALE' : 'MALE';

    // Get candidate profiles
    const candidates = await prisma.profile.findMany({
      where: {
        id: { not: userProfile.id },
        gender: targetGender,
        profileStatus: 'APPROVED'
      },
      include: { 
        preferences: true,
        photos: {
          where: { isPrimary: true },
          take: 1
        }
      },
      take: 200 // Limit for performance
    });

    // Calculate compatibility scores
    const scoredMatches = candidates.map(candidate => {
      const compatibility = computeCompatibility(
        userProfile as ProfileWithPref,
        candidate as ProfileWithPref
      );
      
      return {
        profile: candidate,
        score: compatibility.score,
        breakdown: getBreakdownPercentages(compatibility.breakdown),
        highlights: compatibility.highlights,
        concerns: compatibility.concerns
      };
    });

    // Sort by score descending
    scoredMatches.sort((a, b) => b.score - a.score);

    // Apply membership limits
    const isPremium = req.isPremium;
    const limit = isPremium ? 30 : 10;

    // Format response
    const matches = scoredMatches.slice(0, limit).map(match => {
      const profile = match.profile;
      
      const baseData = {
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
        city: profile.city,
        education: profile.education,
        profession: profile.profession,
        verified: profile.verified,
        trustScore: profile.trustScore,
        score: match.score,
        breakdown: match.breakdown,
        highlights: match.highlights
      };

      if (isPremium) {
        return {
          ...baseData,
          bio: profile.bio,
          photo: profile.photos[0]?.url || null,
          concerns: match.concerns,
          isPremiumLocked: false
        };
      } else {
        return {
          ...baseData,
          photo: profile.photos[0]?.blurredUrl || null,
          isPhotoBlurred: true,
          isPremiumLocked: true
        };
      }
    });

    res.json({
      matches,
      total: scoredMatches.length,
      showing: matches.length,
      isPremium
    });

  } catch (error) {
    console.error('Recommended matches error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

/**
 * GET /api/matches/compatibility/:profileId
 * Get detailed compatibility analysis with a specific profile
 */
router.get('/compatibility/:profileId', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const targetProfileId = parseInt(req.params.profileId, 10);

    if (isNaN(targetProfileId)) {
      res.status(400).json({ error: 'Invalid profile ID' });
      return;
    }

    // Get both profiles
    const [userProfile, targetProfile] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId: req.userId },
        include: { preferences: true }
      }),
      prisma.profile.findUnique({
        where: { id: targetProfileId },
        include: { preferences: true }
      })
    ]);

    if (!userProfile || !targetProfile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Calculate compatibility
    const compatibility = computeCompatibility(
      userProfile as ProfileWithPref,
      targetProfile as ProfileWithPref
    );

    // Premium users get full breakdown
    if (req.isPremium) {
      res.json({
        score: compatibility.score,
        breakdown: getBreakdownPercentages(compatibility.breakdown),
        rawBreakdown: compatibility.breakdown,
        highlights: compatibility.highlights,
        concerns: compatibility.concerns,
        isPremiumLocked: false
      });
    } else {
      // Free users only see overall score
      res.json({
        score: compatibility.score,
        highlights: compatibility.highlights.slice(0, 2),
        isPremiumLocked: true,
        upgradeMessage: 'Upgrade to Premium to see detailed compatibility breakdown'
      });
    }

  } catch (error) {
    console.error('Compatibility error:', error);
    res.status(500).json({ error: 'Failed to calculate compatibility' });
  }
});

/**
 * POST /api/matches/interest/:profileId
 * Send interest to a profile
 */
router.post('/interest/:profileId', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const targetProfileId = parseInt(req.params.profileId, 10);
    const { message } = req.body;

    if (isNaN(targetProfileId)) {
      res.status(400).json({ error: 'Invalid profile ID' });
      return;
    }

    // Get sender's profile
    const senderProfile = await prisma.profile.findUnique({
      where: { userId: req.userId }
    });

    if (!senderProfile) {
      res.status(404).json({ error: 'Please complete your profile first' });
      return;
    }

    if (senderProfile.id === targetProfileId) {
      res.status(400).json({ error: 'Cannot send interest to yourself' });
      return;
    }

    // Check if target exists
    const targetProfile = await prisma.profile.findUnique({
      where: { id: targetProfileId }
    });

    if (!targetProfile || targetProfile.profileStatus !== 'APPROVED') {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Check if interest already exists
    const existingInterest = await prisma.interest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: senderProfile.id,
          receiverId: targetProfileId
        }
      }
    });

    if (existingInterest) {
      res.status(400).json({ error: 'Interest already sent to this profile' });
      return;
    }

    // Create interest
    const interest = await prisma.interest.create({
      data: {
        senderId: senderProfile.id,
        receiverId: targetProfileId,
        message: message || null
      }
    });

    // Check if mutual interest (target also sent interest to sender)
    const mutualInterest = await prisma.interest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: targetProfileId,
          receiverId: senderProfile.id
        }
      }
    });

    if (mutualInterest) {
      // Create a match!
      const compatibility = computeCompatibility(
        senderProfile as ProfileWithPref,
        targetProfile as ProfileWithPref
      );

      await prisma.match.create({
        data: {
          profile1Id: Math.min(senderProfile.id, targetProfileId),
          profile2Id: Math.max(senderProfile.id, targetProfileId),
          status: 'MUTUAL',
          score: compatibility.score,
          breakdown: compatibility.breakdown
        }
      });

      // Update both interests to accepted
      await prisma.interest.updateMany({
        where: {
          OR: [
            { senderId: senderProfile.id, receiverId: targetProfileId },
            { senderId: targetProfileId, receiverId: senderProfile.id }
          ]
        },
        data: { status: 'ACCEPTED' }
      });

      res.json({
        message: 'It\'s a match! You both expressed interest in each other.',
        isMatch: true,
        interestId: interest.id
      });
      return;
    }

    res.json({
      message: 'Interest sent successfully',
      isMatch: false,
      interestId: interest.id
    });

  } catch (error) {
    console.error('Send interest error:', error);
    res.status(500).json({ error: 'Failed to send interest' });
  }
});

/**
 * PUT /api/matches/interest/:interestId/respond
 * Accept or decline an interest
 */
router.put('/interest/:interestId/respond', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const interestId = parseInt(req.params.interestId, 10);
    const { action } = req.body; // 'accept' or 'decline'

    if (isNaN(interestId)) {
      res.status(400).json({ error: 'Invalid interest ID' });
      return;
    }

    if (!['accept', 'decline'].includes(action)) {
      res.status(400).json({ error: 'Action must be accept or decline' });
      return;
    }

    // Get user's profile
    const userProfile = await prisma.profile.findUnique({
      where: { userId: req.userId }
    });

    if (!userProfile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Get the interest
    const interest = await prisma.interest.findUnique({
      where: { id: interestId },
      include: {
        sender: true,
        receiver: true
      }
    });

    if (!interest || interest.receiverId !== userProfile.id) {
      res.status(404).json({ error: 'Interest not found' });
      return;
    }

    if (interest.status !== 'PENDING') {
      res.status(400).json({ error: 'Interest already responded to' });
      return;
    }

    if (action === 'accept') {
      // Update interest status
      await prisma.interest.update({
        where: { id: interestId },
        data: { status: 'ACCEPTED' }
      });

      // Create match
      const compatibility = computeCompatibility(
        interest.sender as ProfileWithPref,
        interest.receiver as ProfileWithPref
      );

      await prisma.match.create({
        data: {
          profile1Id: Math.min(interest.senderId, interest.receiverId),
          profile2Id: Math.max(interest.senderId, interest.receiverId),
          status: 'MUTUAL',
          score: compatibility.score,
          breakdown: compatibility.breakdown
        }
      });

      res.json({
        message: 'Interest accepted! You can now message each other.',
        isMatch: true
      });
    } else {
      // Decline
      await prisma.interest.update({
        where: { id: interestId },
        data: { status: 'DECLINED' }
      });

      res.json({
        message: 'Interest declined',
        isMatch: false
      });
    }

  } catch (error) {
    console.error('Respond to interest error:', error);
    res.status(500).json({ error: 'Failed to respond to interest' });
  }
});

/**
 * GET /api/matches/interests/received
 * Get interests received
 */
router.get('/interests/received', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userProfile = await prisma.profile.findUnique({
      where: { userId: req.userId }
    });

    if (!userProfile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    const interests = await prisma.interest.findMany({
      where: { receiverId: userProfile.id },
      include: {
        sender: {
          include: {
            photos: {
              where: { isPrimary: true },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = interests.map(interest => ({
      id: interest.id,
      status: interest.status,
      message: interest.message,
      createdAt: interest.createdAt,
      sender: {
        id: interest.sender.id,
        profileCode: interest.sender.profileCode,
        firstName: interest.sender.firstName,
        age: calculateAge(interest.sender.dob),
        religion: interest.sender.religion,
        country: interest.sender.country,
        profession: interest.sender.profession,
        photo: req.isPremium 
          ? interest.sender.photos[0]?.url 
          : interest.sender.photos[0]?.blurredUrl
      }
    }));

    res.json({ interests: formatted });

  } catch (error) {
    console.error('Get received interests error:', error);
    res.status(500).json({ error: 'Failed to get interests' });
  }
});

/**
 * GET /api/matches/interests/sent
 * Get interests sent
 */
router.get('/interests/sent', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userProfile = await prisma.profile.findUnique({
      where: { userId: req.userId }
    });

    if (!userProfile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    const interests = await prisma.interest.findMany({
      where: { senderId: userProfile.id },
      include: {
        receiver: {
          include: {
            photos: {
              where: { isPrimary: true },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = interests.map(interest => ({
      id: interest.id,
      status: interest.status,
      message: interest.message,
      createdAt: interest.createdAt,
      receiver: {
        id: interest.receiver.id,
        profileCode: interest.receiver.profileCode,
        firstName: interest.receiver.firstName,
        age: calculateAge(interest.receiver.dob),
        religion: interest.receiver.religion,
        country: interest.receiver.country,
        profession: interest.receiver.profession,
        photo: req.isPremium 
          ? interest.receiver.photos[0]?.url 
          : interest.receiver.photos[0]?.blurredUrl
      }
    }));

    res.json({ interests: formatted });

  } catch (error) {
    console.error('Get sent interests error:', error);
    res.status(500).json({ error: 'Failed to get interests' });
  }
});

/**
 * GET /api/matches/mutual
 * Get mutual matches (both expressed interest)
 */
router.get('/mutual', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userProfile = await prisma.profile.findUnique({
      where: { userId: req.userId }
    });

    if (!userProfile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { profile1Id: userProfile.id },
          { profile2Id: userProfile.id }
        ],
        status: 'MUTUAL'
      },
      include: {
        profile1: {
          include: {
            photos: { where: { isPrimary: true }, take: 1 }
          }
        },
        profile2: {
          include: {
            photos: { where: { isPrimary: true }, take: 1 }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = matches.map(match => {
      const otherProfile = match.profile1Id === userProfile.id 
        ? match.profile2 
        : match.profile1;

      return {
        matchId: match.id,
        score: match.score,
        matchedAt: match.createdAt,
        profile: {
          id: otherProfile.id,
          profileCode: otherProfile.profileCode,
          firstName: otherProfile.firstName,
          age: calculateAge(otherProfile.dob),
          religion: otherProfile.religion,
          community: otherProfile.community,
          country: otherProfile.country,
          city: otherProfile.city,
          profession: otherProfile.profession,
          verified: otherProfile.verified,
          photo: otherProfile.photos[0]?.url || null
        }
      };
    });

    res.json({ matches: formatted });

  } catch (error) {
    console.error('Get mutual matches error:', error);
    res.status(500).json({ error: 'Failed to get matches' });
  }
});

export default router;

