import { describe, it, expect, beforeAll } from 'vitest';
import { generateSigningToken, verifySigningToken, generateSigningLink } from '../jwt';

describe('JWT Utilities for Lease Signing', () => {
  beforeAll(() => {
    // Ensure JWT_SECRET is set for tests
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-secret-key-for-jwt-signing';
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    }
  });

  describe('generateSigningToken', () => {
    it('should generate a valid JWT token', () => {
      const leaseId = 'lease-123';
      const tenantId = 'tenant-456';

      const token = generateSigningToken(leaseId, tenantId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens for different inputs', () => {
      const token1 = generateSigningToken('lease-1', 'tenant-1');
      const token2 = generateSigningToken('lease-2', 'tenant-2');

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifySigningToken', () => {
    it('should verify a valid token and return payload', () => {
      const leaseId = 'lease-123';
      const tenantId = 'tenant-456';
      const token = generateSigningToken(leaseId, tenantId);

      const result = verifySigningToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.leaseId).toBe(leaseId);
      expect(result.payload?.tenantId).toBe(tenantId);
      expect(result.payload?.type).toBe('lease_signing');
      expect(result.error).toBeUndefined();
    });

    it('should reject an invalid token', () => {
      const result = verifySigningToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.payload).toBeUndefined();
    });

    it('should reject a token with wrong type', () => {
      const jwt = require('jsonwebtoken');
      const wrongToken = jwt.sign(
        { leaseId: 'lease-123', tenantId: 'tenant-456', type: 'wrong_type' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      const result = verifySigningToken(wrongToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token type');
    });

    it('should reject a token with missing fields', () => {
      const jwt = require('jsonwebtoken');
      const incompleteToken = jwt.sign(
        { leaseId: 'lease-123', type: 'lease_signing' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      const result = verifySigningToken(incompleteToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing required token fields');
    });
  });

  describe('generateSigningLink', () => {
    it('should generate a complete URL with token', () => {
      const leaseId = 'lease-123';
      const tenantId = 'tenant-456';

      const link = generateSigningLink(leaseId, tenantId);

      expect(link).toBeDefined();
      expect(link).toContain('http://localhost:3000');
      expect(link).toContain('/tenant/sign-lease/');
      expect(link).toContain(leaseId);
      expect(link).toContain('?token=');
    });

    it('should generate a link with a verifiable token', () => {
      const leaseId = 'lease-123';
      const tenantId = 'tenant-456';

      const link = generateSigningLink(leaseId, tenantId);
      const tokenMatch = link.match(/\?token=(.+)$/);

      expect(tokenMatch).not.toBeNull();

      if (tokenMatch) {
        const token = tokenMatch[1];
        const result = verifySigningToken(token);

        expect(result.valid).toBe(true);
        expect(result.payload?.leaseId).toBe(leaseId);
        expect(result.payload?.tenantId).toBe(tenantId);
      }
    });
  });
});
