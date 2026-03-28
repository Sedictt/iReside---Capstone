import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * JWT utilities for lease signing links
 * Provides secure token generation and verification for tenant lease signing
 */

const JWT_SECRET = process.env.JWT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

interface SigningTokenPayload {
  leaseId: string;
  tenantId: string;
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
 * @param tenantId - The ID of the tenant who will sign
 * @returns JWT token string
 */
export function generateSigningToken(leaseId: string, tenantId: string): string {
  const payload: SigningTokenPayload = {
    leaseId,
    tenantId,
    type: 'lease_signing',
  };

  // 30 days expiration
  const token = jwt.sign(payload, JWT_SECRET, {
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
    const decoded = jwt.verify(token, JWT_SECRET) as SigningTokenPayload;

    // Validate token type
    if (decoded.type !== 'lease_signing') {
      return {
        valid: false,
        error: 'Invalid token type',
      };
    }

    // Validate required fields
    if (!decoded.leaseId || !decoded.tenantId) {
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
  const token = generateSigningToken(leaseId, tenantId);
  return `${APP_URL}/tenant/sign-lease/${leaseId}?token=${token}`;
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
 * @param tenantId - The ID of the tenant
 * @returns Object containing token and hash
 */
export function generateTokenWithHash(
  leaseId: string,
  tenantId: string
): { token: string; hash: string; expiresAt: Date } {
  const token = generateSigningToken(leaseId, tenantId);
  const hash = hashToken(token);
  
  // Calculate expiration date (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  return { token, hash, expiresAt };
}
