/**
 * Golden Bond - Search & Filter Routes
 * Profile search with advanced filtering
 */

import { Router, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { requireAuth, optionalAuth, AuthedRequest } from '../middleware/auth';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config';

const prisma = new PrismaClient();
const router = Router();

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

/**
 * Helper: Get date from age
 */
function getDateFromAge(age: number): Date {
  const today = new Date();
  return new Date(today.getFullYear() - age, today.getMonth(), today.getDate());
}

/**
 * GET /api/search/profiles
 * Search profiles with filters
 * 
 * Query params:
 * - gender: MALE, FEMALE
 * - ageMin, ageMax: number
 * - religion: string
 * - community: string
 * - country: string
 * - state: string
 * - maritalStatus: NEVER_MARRIED, DIVORCED, etc.
 * - education: string
 * - profession: string
 * - diet: VEGETARIAN, NON_VEGETARIAN, etc.
 * - verified: boolean
 * - page: number
 * - limit: number
 * - sort: recent, compatibility
 */
router.get('/profiles', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const {
      gender,
      ageMin,
      ageMax,
      religion,
      community,
      country,
      state,
      city,
      maritalStatus,
      education,
      profession,
      diet,
      smoking,
      drinking,
      verified,
      motherTongue,
      page = '1',
      limit = String(DEFAULT_PAGE_SIZE),
      sort = 'recent'
    } = req.query;

    // Build filter conditions
    const where: Prisma.ProfileWhereInput = {
      profileStatus: 'APPROVED',
      userId: { not: req.userId } // Exclude own profile
    };

    // Gender filter
    if (gender && typeof gender === 'string') {
      where.gender = gender as any;
    }

    // Age filter (convert to DOB range)
    if (ageMin || ageMax) {
      const minAge = ageMin ? parseInt(ageMin as string, 10) : 18;
      const maxAge = ageMax ? parseInt(ageMax as string, 10) : 80;
      
      where.dob = {
        gte: getDateFromAge(maxAge + 1),
        lte: getDateFromAge(minAge)
      };
    }

    // Religion filter
    if (religion && typeof religion === 'string' && religion !== 'Any') {
      where.religion = religion;
    }

    // Community filter
    if (community && typeof community === 'string' && community !== 'Any') {
      where.community = community;
    }

    // Location filters
    if (country && typeof country === 'string' && country !== 'Any') {
      where.country = country;
    }

    if (state && typeof state === 'string') {
      where.state = state;
    }

    if (city && typeof city === 'string') {
      where.city = { contains: city, mode: 'insensitive' };
    }

    // Marital status filter
    if (maritalStatus && typeof maritalStatus === 'string') {
      where.maritalStatus = maritalStatus as any;
    }

    // Education filter
    if (education && typeof education === 'string') {
      where.education = { contains: education, mode: 'insensitive' };
    }

    // Profession filter
    if (profession && typeof profession === 'string') {
      where.profession = { contains: profession, mode: 'insensitive' };
    }

    // Lifestyle filters
    if (diet && typeof diet === 'string') {
      where.diet = diet as any;
    }

    if (smoking && typeof smoking === 'string') {
      where.smoking = smoking as any;
    }

    if (drinking && typeof drinking === 'string') {
      where.drinking = drinking as any;
    }

    // Mother tongue filter
    if (motherTongue && typeof motherTongue === 'string') {
      where.motherTongue = motherTongue;
    }

    // Verified only filter
    if (verified === 'true') {
      where.verified = true;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let orderBy: Prisma.ProfileOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'trustScore') {
      orderBy = { trustScore: 'desc' };
    }

    // Execute query
    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        include: {
          photos: {
            where: { isPrimary: true },
            take: 1
          }
        },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.profile.count({ where })
    ]);

    // Format response based on membership
    const isPremium = req.isPremium;

    const formattedProfiles = profiles.map(profile => {
      const baseProfile = {
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
        createdAt: profile.createdAt
      };

      if (isPremium) {
        // Premium users see more details
        return {
          ...baseProfile,
          bio: profile.bio,
          height: profile.height,
          diet: profile.diet,
          motherTongue: profile.motherTongue,
          languagesKnown: profile.languagesKnown,
          photo: profile.photos[0]?.url || null,
          isPremiumLocked: false
        };
      } else {
        // Free users see limited info
        return {
          ...baseProfile,
          photo: profile.photos[0]?.blurredUrl || profile.photos[0]?.url || null,
          isPhotoBlurred: true,
          isPremiumLocked: true
        };
      }
    });

    res.json({
      profiles: formattedProfiles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + profiles.length < total
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /api/search/quick
 * Quick search for homepage
 */
router.get('/quick', optionalAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { gender, ageMin, ageMax, religion, country } = req.query;

    const where: Prisma.ProfileWhereInput = {
      profileStatus: 'APPROVED'
    };

    if (gender && typeof gender === 'string') {
      where.gender = gender as any;
    }

    if (ageMin || ageMax) {
      const minAge = ageMin ? parseInt(ageMin as string, 10) : 18;
      const maxAge = ageMax ? parseInt(ageMax as string, 10) : 60;
      
      where.dob = {
        gte: getDateFromAge(maxAge + 1),
        lte: getDateFromAge(minAge)
      };
    }

    if (religion && typeof religion === 'string' && religion !== 'Any') {
      where.religion = religion;
    }

    if (country && typeof country === 'string' && country !== 'Any') {
      where.country = country;
    }

    // Exclude own profile if logged in
    if (req.userId) {
      where.userId = { not: req.userId };
    }

    const profiles = await prisma.profile.findMany({
      where,
      include: {
        photos: {
          where: { isPrimary: true },
          take: 1
        }
      },
      orderBy: { trustScore: 'desc' },
      take: 12
    });

    const formattedProfiles = profiles.map(profile => ({
      id: profile.id,
      profileCode: profile.profileCode,
      firstName: profile.firstName,
      gender: profile.gender,
      age: calculateAge(profile.dob),
      religion: profile.religion,
      community: profile.community,
      country: profile.country,
      state: profile.state,
      education: profile.education,
      profession: profile.profession,
      verified: profile.verified,
      photo: profile.photos[0]?.blurredUrl || profile.photos[0]?.url || null,
      isPhotoBlurred: !req.isPremium
    }));

    res.json({ profiles: formattedProfiles });

  } catch (error) {
    console.error('Quick search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /api/search/filters
 * Get available filter options (for dropdowns)
 */
router.get('/filters', async (req, res: Response) => {
  try {
    // Get distinct values for filters
    const [religions, countries, educations] = await Promise.all([
      prisma.profile.findMany({
        where: { profileStatus: 'APPROVED' },
        select: { religion: true },
        distinct: ['religion']
      }),
      prisma.profile.findMany({
        where: { profileStatus: 'APPROVED' },
        select: { country: true },
        distinct: ['country']
      }),
      prisma.profile.findMany({
        where: { profileStatus: 'APPROVED' },
        select: { education: true },
        distinct: ['education']
      })
    ]);

    res.json({
      religions: religions.map(r => r.religion).filter(Boolean).sort(),
      countries: countries.map(c => c.country).filter(Boolean).sort(),
      educations: educations.map(e => e.education).filter(Boolean).sort(),
      maritalStatuses: ['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'AWAITING_DIVORCE', 'ANNULLED'],
      diets: ['VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'VEGAN', 'JAIN'],
      habits: ['YES', 'NO', 'OCCASIONALLY']
    });

  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ error: 'Failed to get filters' });
  }
});

/**
 * GET /api/search/suggestions
 * Get search suggestions based on partial input
 */
router.get('/suggestions', async (req, res: Response) => {
  try {
    const { field, query } = req.query;

    if (!field || !query || typeof query !== 'string') {
      res.status(400).json({ error: 'Field and query required' });
      return;
    }

    let suggestions: string[] = [];

    switch (field) {
      case 'city':
        const cities = await prisma.profile.findMany({
          where: {
            city: { contains: query, mode: 'insensitive' },
            profileStatus: 'APPROVED'
          },
          select: { city: true },
          distinct: ['city'],
          take: 10
        });
        suggestions = cities.map(c => c.city).filter(Boolean) as string[];
        break;

      case 'profession':
        const professions = await prisma.profile.findMany({
          where: {
            profession: { contains: query, mode: 'insensitive' },
            profileStatus: 'APPROVED'
          },
          select: { profession: true },
          distinct: ['profession'],
          take: 10
        });
        suggestions = professions.map(p => p.profession).filter(Boolean) as string[];
        break;

      case 'college':
        const colleges = await prisma.profile.findMany({
          where: {
            college: { contains: query, mode: 'insensitive' },
            profileStatus: 'APPROVED'
          },
          select: { college: true },
          distinct: ['college'],
          take: 10
        });
        suggestions = colleges.map(c => c.college).filter(Boolean) as string[];
        break;
    }

    res.json({ suggestions });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

export default router;

