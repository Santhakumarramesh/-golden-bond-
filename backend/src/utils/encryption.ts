/**
 * Golden Bond - Data Encryption Utilities
 * Encrypts sensitive user data at rest
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  // If key is provided as hex string, convert it
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  
  // Otherwise, derive key using PBKDF2
  return crypto.pbkdf2Sync(key, 'goldenbond-salt', ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt sensitive data (like phone numbers, addresses, etc.)
 */
export function encryptData(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Return: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, tagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data (one-way, for verification)
 */
export function hashData(data: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.pbkdf2Sync(data, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hash: string): boolean {
  try {
    const [saltHex, hashHex] = hash.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const computedHash = crypto.pbkdf2Sync(data, salt, ITERATIONS, KEY_LENGTH, 'sha512');
    return computedHash.toString('hex') === hashHex;
  } catch (error) {
    return false;
  }
}

/**
 * Mask sensitive data for display (e.g., phone numbers, emails)
 */
export function maskData(data: string, type: 'email' | 'phone' | 'credit'): string {
  if (type === 'email') {
    const [local, domain] = data.split('@');
    if (local.length <= 2) return data;
    const masked = local[0] + '*'.repeat(Math.min(local.length - 2, 3)) + local[local.length - 1];
    return `${masked}@${domain}`;
  }
  
  if (type === 'phone') {
    // Show last 4 digits only
    const cleaned = data.replace(/\D/g, '');
    if (cleaned.length <= 4) return '****';
    return '****' + cleaned.slice(-4);
  }
  
  if (type === 'credit') {
    // Show last 4 digits only
    const cleaned = data.replace(/\D/g, '');
    if (cleaned.length <= 4) return '****';
    return '**** **** **** ' + cleaned.slice(-4);
  }
  
  return data;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate secure API key
 */
export function generateApiKey(): string {
  return `gb_${crypto.randomBytes(32).toString('base64url')}`;
}

