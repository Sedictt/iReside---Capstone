import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateSigningToken,
  verifySigningToken,
  generateSigningLink,
  generateRoomOfferToken,
  verifyRoomOfferToken,
  generateRoomOfferLink,
  generateApplicationStatusToken,
  verifyApplicationStatusToken,
  generateApplicationStatusLink,
} from '../jwt';

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
      expect(result.payload?.actorId).toBe(tenantId);
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
        { leaseId: 'lease-123', actorId: 'tenant-456', role: 'tenant', type: 'wrong_type' },
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
      expect(link).toContain('/signing/tenant/');
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
        expect(result.payload?.actorId).toBe(tenantId);
      }
    });
  });

  describe('room offer tokens', () => {
    it('generates and verifies a room offer token', () => {
      const token = generateRoomOfferToken('app-123', 'unit-456');
      const result = verifyRoomOfferToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload?.applicationId).toBe('app-123');
      expect(result.payload?.targetUnitId).toBe('unit-456');
      expect(result.payload?.type).toBe('room_offer');
    });

    it('rejects lease signing tokens when verifying room offer tokens', () => {
      const leaseToken = generateSigningToken('lease-123', 'tenant-456');
      const result = verifyRoomOfferToken(leaseToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token type');
    });

    it('generates a verifiable /apply/offer link', () => {
      const link = generateRoomOfferLink('app-123', 'unit-456');
      expect(link).toContain('/apply/offer?token=');

      const tokenParam = decodeURIComponent(link.split('?token=')[1]);
      const result = verifyRoomOfferToken(tokenParam);
      expect(result.valid).toBe(true);
      expect(result.payload?.applicationId).toBe('app-123');
      expect(result.payload?.targetUnitId).toBe('unit-456');
    });
  });

  describe('application status tokens', () => {
    it('generates and verifies an application status token', () => {
      const token = generateApplicationStatusToken('app-status-123');
      const result = verifyApplicationStatusToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload?.applicationId).toBe('app-status-123');
      expect(result.payload?.type).toBe('application_status');
    });

    it('rejects tokens with wrong type', () => {
      const leaseToken = generateSigningToken('lease-123', 'tenant-456');
      const roomOfferToken = generateRoomOfferToken('app-123', 'unit-456');

      expect(verifyApplicationStatusToken(leaseToken)).toEqual({
        valid: false,
        error: 'Invalid token type',
      });
      expect(verifyApplicationStatusToken(roomOfferToken)).toEqual({
        valid: false,
        error: 'Invalid token type',
      });
    });

    it('rejects expired tokens', () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { applicationId: 'app-123', type: 'application_status' },
        process.env.JWT_SECRET,
        { expiresIn: '-10s' }
      );

      const result = verifyApplicationStatusToken(expiredToken);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('This status link has expired.');
    });

    it('rejects tampered tokens', () => {
      const token = generateApplicationStatusToken('app-status-123');
      const parts = token.split('.');
      const tampered = `${parts[0]}.${parts[1]}.tamperedSignature`;

      const result = verifyApplicationStatusToken(tampered);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid status link.');
    });

    it('rejects tokens with missing applicationId', () => {
      const jwt = require('jsonwebtoken');
      const incompleteToken = jwt.sign(
        { type: 'application_status' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      const result = verifyApplicationStatusToken(incompleteToken);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing required token fields');
    });

    it('generates a verifiable /apply/status link', () => {
      const link = generateApplicationStatusLink('app-status-999');
      expect(link).toContain('/apply/status?token=');

      const tokenParam = decodeURIComponent(link.split('?token=')[1]);
      const result = verifyApplicationStatusToken(tokenParam);
      expect(result.valid).toBe(true);
      expect(result.payload?.applicationId).toBe('app-status-999');
    });
  });
});
