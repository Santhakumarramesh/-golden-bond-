/**
 * Golden Bond - AI Matchmaking Engine
 * Calculates compatibility scores between profiles
 */

import { Profile, Preference } from '@prisma/client';
import { COMPATIBILITY_WEIGHTS } from '../config';

// Extended profile type with preferences
export interface ProfileWithPref extends Profile {
  preferences?: Preference | null;
}

// Compatibility result
export interface CompatibilityResult {
  score: number;
  breakdown: {
    age: number;
    religion: number;
    community: number;
    location: number;
    languages: number;
    education: number;
    lifestyle: number;
  };
  highlights: string[];
  concerns: string[];
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Calculate compatibility between two profiles
 */
export function computeCompatibility(
  user: ProfileWithPref,
  target: ProfileWithPref
): CompatibilityResult {
  const breakdown = {
    age: 0,
    religion: 0,
    community: 0,
    location: 0,
    languages: 0,
    education: 0,
    lifestyle: 0
  };
  
  const highlights: string[] = [];
  const concerns: string[] = [];

  const userAge = calculateAge(user.dob);
  const targetAge = calculateAge(target.dob);
  const userPrefs = user.preferences;

  // ========================================
  // 1. AGE COMPATIBILITY (15 points max)
  // ========================================
  if (userPrefs) {
    const { ageMin, ageMax } = userPrefs;
    if (targetAge >= ageMin && targetAge <= ageMax) {
      breakdown.age = COMPATIBILITY_WEIGHTS.age;
      highlights.push(`Age ${targetAge} is within your preferred range`);
    } else {
      // Partial score based on how close
      const distance = targetAge < ageMin 
        ? ageMin - targetAge 
        : targetAge - ageMax;
      breakdown.age = Math.max(0, COMPATIBILITY_WEIGHTS.age - (distance * 2));
      
      if (distance > 5) {
        concerns.push(`Age difference is outside your preferred range`);
      }
    }
  } else {
    // No preferences set, give partial score
    breakdown.age = COMPATIBILITY_WEIGHTS.age * 0.7;
  }

  // ========================================
  // 2. RELIGION COMPATIBILITY (20 points max)
  // ========================================
  if (userPrefs?.religionsAllowed?.length) {
    const allowedReligions = userPrefs.religionsAllowed;
    
    if (allowedReligions.includes('Any') || allowedReligions.includes(target.religion)) {
      breakdown.religion = COMPATIBILITY_WEIGHTS.religion;
      
      if (user.religion === target.religion) {
        highlights.push(`Same religion: ${target.religion}`);
      }
    } else {
      breakdown.religion = 0;
      concerns.push(`Different religion: ${target.religion}`);
    }
  } else {
    // No preference set
    if (user.religion === target.religion) {
      breakdown.religion = COMPATIBILITY_WEIGHTS.religion;
      highlights.push(`Same religion: ${target.religion}`);
    } else {
      breakdown.religion = COMPATIBILITY_WEIGHTS.religion * 0.5;
    }
  }

  // ========================================
  // 3. COMMUNITY COMPATIBILITY (10 points max)
  // ========================================
  if (user.religion === target.religion && user.community && target.community) {
    if (user.community === target.community) {
      breakdown.community = COMPATIBILITY_WEIGHTS.community;
      highlights.push(`Same community: ${target.community}`);
    } else {
      // Different community but same religion
      breakdown.community = COMPATIBILITY_WEIGHTS.community * 0.5;
    }
  } else if (user.religion === target.religion) {
    breakdown.community = COMPATIBILITY_WEIGHTS.community * 0.7;
  }

  // ========================================
  // 4. LOCATION COMPATIBILITY (15 points max)
  // ========================================
  if (user.country === target.country) {
    breakdown.location = COMPATIBILITY_WEIGHTS.location;
    
    if (user.state === target.state) {
      highlights.push(`Same state: ${target.state}, ${target.country}`);
    } else {
      highlights.push(`Same country: ${target.country}`);
    }
    
    if (user.city && target.city && user.city === target.city) {
      highlights.push(`Same city: ${target.city}`);
    }
  } else {
    // Different country
    if (userPrefs?.countriesAllowed?.length) {
      if (userPrefs.countriesAllowed.includes('Any') || 
          userPrefs.countriesAllowed.includes(target.country)) {
        breakdown.location = COMPATIBILITY_WEIGHTS.location * 0.7;
      } else {
        breakdown.location = COMPATIBILITY_WEIGHTS.location * 0.3;
        concerns.push(`Located in ${target.country}`);
      }
    } else {
      breakdown.location = COMPATIBILITY_WEIGHTS.location * 0.5;
    }
  }

  // ========================================
  // 5. LANGUAGE COMPATIBILITY (15 points max)
  // ========================================
  const userLangs = new Set(user.languagesKnown || []);
  const targetLangs = new Set(target.languagesKnown || []);
  
  // Add mother tongue to languages
  if (user.motherTongue) userLangs.add(user.motherTongue);
  if (target.motherTongue) targetLangs.add(target.motherTongue);
  
  const commonLangs = [...userLangs].filter(l => targetLangs.has(l));
  
  if (commonLangs.length > 0) {
    const langScore = Math.min(commonLangs.length * 5, COMPATIBILITY_WEIGHTS.languages);
    breakdown.languages = langScore;
    
    if (commonLangs.length >= 2) {
      highlights.push(`${commonLangs.length} common languages`);
    } else if (user.motherTongue === target.motherTongue) {
      highlights.push(`Same mother tongue: ${user.motherTongue}`);
    }
  } else {
    breakdown.languages = 0;
    concerns.push('No common languages');
  }

  // ========================================
  // 6. EDUCATION COMPATIBILITY (10 points max)
  // ========================================
  const educationLevels: Record<string, number> = {
    'High School': 1,
    'Diploma': 2,
    'Bachelor\'s': 3,
    'Master\'s': 4,
    'PhD': 5,
    'Professional': 4
  };

  const userEduLevel = getEducationLevel(user.education, educationLevels);
  const targetEduLevel = getEducationLevel(target.education, educationLevels);

  if (userEduLevel && targetEduLevel) {
    const eduDiff = Math.abs(userEduLevel - targetEduLevel);
    
    if (eduDiff === 0) {
      breakdown.education = COMPATIBILITY_WEIGHTS.education;
      highlights.push(`Similar education level`);
    } else if (eduDiff === 1) {
      breakdown.education = COMPATIBILITY_WEIGHTS.education * 0.8;
    } else {
      breakdown.education = COMPATIBILITY_WEIGHTS.education * 0.5;
    }
  } else {
    breakdown.education = COMPATIBILITY_WEIGHTS.education * 0.6;
  }

  // ========================================
  // 7. LIFESTYLE COMPATIBILITY (15 points max)
  // ========================================
  let lifestyleScore = 0;
  let lifestyleFactors = 0;

  // Diet
  if (user.diet && target.diet) {
    lifestyleFactors++;
    if (user.diet === target.diet) {
      lifestyleScore += 5;
      highlights.push(`Same diet preference: ${formatEnum(target.diet)}`);
    } else if (
      (user.diet === 'VEGETARIAN' && target.diet === 'VEGAN') ||
      (user.diet === 'VEGAN' && target.diet === 'VEGETARIAN')
    ) {
      lifestyleScore += 3; // Similar
    }
  }

  // Smoking
  if (user.smoking && target.smoking) {
    lifestyleFactors++;
    if (user.smoking === target.smoking) {
      lifestyleScore += 5;
    } else if (user.smoking === 'NO' && target.smoking !== 'NO') {
      concerns.push(`Partner ${target.smoking === 'YES' ? 'smokes' : 'smokes occasionally'}`);
    }
  }

  // Drinking
  if (user.drinking && target.drinking) {
    lifestyleFactors++;
    if (user.drinking === target.drinking) {
      lifestyleScore += 5;
    } else if (user.drinking === 'NO' && target.drinking !== 'NO') {
      concerns.push(`Partner ${target.drinking === 'YES' ? 'drinks' : 'drinks occasionally'}`);
    }
  }

  breakdown.lifestyle = Math.min(lifestyleScore, COMPATIBILITY_WEIGHTS.lifestyle);

  // ========================================
  // CALCULATE TOTAL SCORE
  // ========================================
  const totalScore = Math.round(
    breakdown.age +
    breakdown.religion +
    breakdown.community +
    breakdown.location +
    breakdown.languages +
    breakdown.education +
    breakdown.lifestyle
  );

  // Normalize to 0-100
  const maxPossible = Object.values(COMPATIBILITY_WEIGHTS).reduce((a, b) => a + b, 0);
  const normalizedScore = Math.round((totalScore / maxPossible) * 100);

  return {
    score: Math.min(100, normalizedScore),
    breakdown,
    highlights: highlights.slice(0, 5),
    concerns: concerns.slice(0, 3)
  };
}

/**
 * Get education level from string
 */
function getEducationLevel(education: string | null, levels: Record<string, number>): number | null {
  if (!education) return null;
  
  const eduLower = education.toLowerCase();
  
  if (eduLower.includes('phd') || eduLower.includes('doctorate')) return levels['PhD'];
  if (eduLower.includes('master') || eduLower.includes('m.tech') || eduLower.includes('mba')) return levels['Master\'s'];
  if (eduLower.includes('bachelor') || eduLower.includes('b.tech') || eduLower.includes('b.e')) return levels['Bachelor\'s'];
  if (eduLower.includes('diploma')) return levels['Diploma'];
  if (eduLower.includes('high school') || eduLower.includes('12th')) return levels['High School'];
  if (eduLower.includes('doctor') || eduLower.includes('lawyer') || eduLower.includes('ca')) return levels['Professional'];
  
  return levels['Bachelor\'s']; // Default assumption
}

/**
 * Format enum value for display
 */
function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get top matches for a user
 */
export async function getTopMatches(
  user: ProfileWithPref,
  candidates: ProfileWithPref[],
  limit: number = 30
): Promise<Array<{ profile: ProfileWithPref; compatibility: CompatibilityResult }>> {
  // Calculate compatibility for all candidates
  const scored = candidates.map(candidate => ({
    profile: candidate,
    compatibility: computeCompatibility(user, candidate)
  }));

  // Sort by score descending
  scored.sort((a, b) => b.compatibility.score - a.compatibility.score);

  // Return top matches
  return scored.slice(0, limit);
}

/**
 * Get compatibility breakdown as percentages
 */
export function getBreakdownPercentages(breakdown: CompatibilityResult['breakdown']): Record<string, number> {
  return {
    age: Math.round((breakdown.age / COMPATIBILITY_WEIGHTS.age) * 100),
    religion: Math.round((breakdown.religion / COMPATIBILITY_WEIGHTS.religion) * 100),
    community: Math.round((breakdown.community / COMPATIBILITY_WEIGHTS.community) * 100),
    location: Math.round((breakdown.location / COMPATIBILITY_WEIGHTS.location) * 100),
    languages: Math.round((breakdown.languages / COMPATIBILITY_WEIGHTS.languages) * 100),
    education: Math.round((breakdown.education / COMPATIBILITY_WEIGHTS.education) * 100),
    lifestyle: Math.round((breakdown.lifestyle / COMPATIBILITY_WEIGHTS.lifestyle) * 100)
  };
}

