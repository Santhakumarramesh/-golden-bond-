/**
 * Golden Bond - Configuration
 * Environment variables and app settings
 */

import dotenv from 'dotenv';
dotenv.config();

// Server
export const PORT = parseInt(process.env.PORT || '4000', 10);
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';

// JWT
export const JWT_SECRET = process.env.JWT_SECRET || 'goldenbond-dev-secret-change-in-production';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'goldenbond-refresh-secret-change-in-production';
export const JWT_EXPIRES_IN = '7d';
export const JWT_REFRESH_EXPIRES_IN = '30d';

// CORS
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// Rate Limiting
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Membership Features
export const MEMBERSHIP_FEATURES = {
  FREE: {
    dailyProfileViews: 10,
    dailyInterests: 5,
    canMessage: false,
    canSeeVisitors: false,
    canSeeFullPhotos: false,
    aiRecommendations: false,
    profileBoost: 1
  },
  GOLD: {
    dailyProfileViews: -1, // unlimited
    dailyInterests: 30,
    canMessage: false,
    canSeeVisitors: true,
    canSeeFullPhotos: true,
    aiRecommendations: false,
    profileBoost: 1.5
  },
  DIAMOND: {
    dailyProfileViews: -1,
    dailyInterests: -1,
    canMessage: true,
    canSeeVisitors: true,
    canSeeFullPhotos: true,
    aiRecommendations: true,
    profileBoost: 2
  },
  ELITE: {
    dailyProfileViews: -1,
    dailyInterests: -1,
    canMessage: true,
    canSeeVisitors: true,
    canSeeFullPhotos: true,
    aiRecommendations: true,
    profileBoost: 5
  }
};

// Trust Score Weights
export const TRUST_SCORE_WEIGHTS = {
  emailVerified: 10,
  phoneVerified: 15,
  idVerified: 20,
  photoVerified: 15,
  videoVerified: 20,
  profileComplete: 20
};

// Compatibility Score Weights
export const COMPATIBILITY_WEIGHTS = {
  age: 15,
  religion: 20,
  community: 10,
  location: 15,
  languages: 15,
  education: 10,
  lifestyle: 15
};

