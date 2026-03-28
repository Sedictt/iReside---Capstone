import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock nodemailer before importing the email module
const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-message-id' });
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

describe('Email Utilities', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Set required environment variables
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASS = 'test-password';
    process.env.SMTP_FROM = 'iReside <noreply@ireside.app>';
  });

  describe('sendTenantCredentials', () => {
    it('should send email with basic credentials', async () => {
      const { sendTenantCredentials } = await import('../email');

      await sendTenantCredentials({
        to: 'tenant@example.com',
        tenantName: 'John Doe',
        tempPassword: 'TempPass123!',
        inviteUrl: 'https://example.com/reset',
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];
      
      expect(callArgs.to).toBe('tenant@example.com');
      expect(callArgs.subject).toContain('Welcome to iReside');
      expect(callArgs.html).toContain('John Doe');
      expect(callArgs.html).toContain('TempPass123!');
      expect(callArgs.text).toContain('John Doe');
      expect(callArgs.text).toContain('TempPass123!');
    });

    it('should include lease details when provided', async () => {
      const { sendTenantCredentials } = await import('../email');

      const leaseDetails = {
        property_name: 'Sunset Apartments',
        unit_name: 'Unit 101',
        move_in_date: '2024-04-01',
        monthly_rent: 15000,
      };

      await sendTenantCredentials({
        to: 'tenant@example.com',
        tenantName: 'John Doe',
        tempPassword: 'TempPass123!',
        inviteUrl: 'https://example.com/reset',
        leaseDetails,
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];
      
      expect(callArgs.html).toContain('Sunset Apartments');
      expect(callArgs.html).toContain('Unit 101');
      expect(callArgs.html).toContain('15,000.00');
      expect(callArgs.text).toContain('LEASE DETAILS:');
      expect(callArgs.text).toContain('Sunset Apartments');
      expect(callArgs.text).toContain('Unit 101');
    });

    it('should include signing link when provided', async () => {
      const { sendTenantCredentials } = await import('../email');

      const signingLink = 'https://example.com/tenant/sign-lease/lease-123?token=abc123';

      await sendTenantCredentials({
        to: 'tenant@example.com',
        tenantName: 'John Doe',
        tempPassword: 'TempPass123!',
        inviteUrl: 'https://example.com/reset',
        signingLink,
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];
      
      expect(callArgs.html).toContain('Sign Your Lease Agreement');
      expect(callArgs.html).toContain(signingLink);
      expect(callArgs.text).toContain('SIGN YOUR LEASE:');
      expect(callArgs.text).toContain(signingLink);
    });

    it('should include both lease details and signing link when provided', async () => {
      const { sendTenantCredentials } = await import('../email');

      const leaseDetails = {
        property_name: 'Sunset Apartments',
        unit_name: 'Unit 101',
        move_in_date: '2024-04-01',
        monthly_rent: 15000,
      };

      const signingLink = 'https://example.com/tenant/sign-lease/lease-123?token=abc123';

      await sendTenantCredentials({
        to: 'tenant@example.com',
        tenantName: 'John Doe',
        tempPassword: 'TempPass123!',
        inviteUrl: 'https://example.com/reset',
        leaseDetails,
        signingLink,
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];
      
      // Check lease details
      expect(callArgs.html).toContain('Sunset Apartments');
      expect(callArgs.html).toContain('Unit 101');
      
      // Check signing link
      expect(callArgs.html).toContain('Sign Your Lease Agreement');
      expect(callArgs.html).toContain(signingLink);
      
      // Check text version
      expect(callArgs.text).toContain('LEASE DETAILS:');
      expect(callArgs.text).toContain('SIGN YOUR LEASE:');
    });

    it('should work without optional parameters', async () => {
      const { sendTenantCredentials } = await import('../email');

      await sendTenantCredentials({
        to: 'tenant@example.com',
        tenantName: 'John Doe',
        tempPassword: 'TempPass123!',
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];
      
      expect(callArgs.to).toBe('tenant@example.com');
      expect(callArgs.html).toContain('John Doe');
      expect(callArgs.html).not.toContain('LEASE DETAILS');
      expect(callArgs.html).not.toContain('Sign Your Lease Agreement');
    });
  });
});
