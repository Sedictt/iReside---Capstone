import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * JWT utilities for lease signing links
 * Provides secure token generation and verification for tenant lease signing
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const FALLBACK_JWT_SECRET = 'iReside-dev-fallback-secret-2024';
const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_JWT_SECRET;

const getJwtSecret = (): string => JWT_SECRET;

interface SigningTokenPayload {
  leaseId: string;
  actorId: string;
  role: 'tenant' | 'landlord';
  type: 'lease_signing';
}

interface VerifyTokenResult {
  valid: boolean;
  payload?: SigningTokenPayload;
  error?: string;
}

/**
 * Generate a JWT token for lease signing with 30-day expiration
 * @param leaseId - The ID of the lease to be signed
 * @param actorId - The ID of the person who will sign (tenant or landlord)
 * @param role - The role of the signer
 * @returns JWT token string
 */
export function generateSigningToken(leaseId: string, actorId: string, role: 'tenant' | 'landlord' = 'tenant'): string {
  const payload: SigningTokenPayload = {
    leaseId,
    actorId,
    role,
    type: 'lease_signing',
  };

  // 30 days expiration
  const token = jwt.sign(payload, getJwtSecret(), {
    expiresIn: '30d',
  });

  return token;
}

/**
 * Verify a signing token and extract payload
 * @param token - The JWT token to verify
 * @returns Verification result with payload if valid
 */
export function verifySigningToken(token: string): VerifyTokenResult {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as SigningTokenPayload;

    // Validate token type
    if (decoded.type !== 'lease_signing') {
      return {
        valid: false,
        error: 'Invalid token type',
      };
    }

    // Validate required fields
    if (!decoded.leaseId || !decoded.actorId || !decoded.role) {
      return {
        valid: false,
        error: 'Missing required token fields',
      };
    }

    return {
      valid: true,
      payload: decoded,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        error: 'Token has expired',
      };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Invalid token',
      };
    }

    return {
      valid: false,
      error: 'Token verification failed',
    };
  }
}

/**
 * Generate a complete signing link URL for tenant lease signing
 * @param leaseId - The ID of the lease to be signed
 * @param tenantId - The ID of the tenant who will sign
 * @returns Full URL with embedded JWT token
 */
export function generateSigningLink(leaseId: string, tenantId: string): string {
  const token = generateSigningToken(leaseId, tenantId, 'tenant');
  return `${APP_URL}/signing/tenant/${leaseId}?token=${token}`;
}

/**
 * Generate a complete signing link URL for landlord lease signing
 * @param leaseId - The ID of the lease to be signed
 * @param landlordId - The ID of the landlord who will sign
 * @returns Full URL with embedded JWT token
 */
export function generateLandlordSigningLink(leaseId: string, landlordId: string): string {
  const token = generateSigningToken(leaseId, landlordId, 'landlord');
  return `${APP_URL}/signing/landlord/${leaseId}?token=${token}`;
}

/**
 * Generate SHA-256 hash of a JWT token for secure storage
 * Tokens are hashed before storing in database to prevent token exposure if DB is compromised
 * @param token - The JWT token to hash
 * @returns SHA-256 hash of the token (hex string)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify if a given token matches a stored hash
 * @param token - The JWT token to check
 * @param storedHash - The hash stored in database
 * @returns True if token matches the hash
 */
export function verifyTokenHash(token: string, storedHash: string): boolean {
  const tokenHash = hashToken(token);
  return tokenHash === storedHash;
}

/**
 * Generate token and its hash for storage
 * Convenience function that returns both token and hash in one call
 * @param leaseId - The ID of the lease
 * @param actorId - The ID of the tenant or landlord
 * @param role - The role of the signer
 * @returns Object containing token and hash
 */
export function generateTokenWithHash(
  leaseId: string,
  actorId: string,
  role: 'tenant' | 'landlord' = 'tenant'
): { token: string; hash: string; expiresAt: Date } {
  const token = generateSigningToken(leaseId, actorId, role);
  const hash = hashToken(token);
  
  // Calculate expiration date (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  return { token, hash, expiresAt };
}
