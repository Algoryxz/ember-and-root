import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  signupSchema,
  onboardingSchema,
  isValidIanaTimezone,
  isOnboardingComplete,
} from './validation';

describe('Auth Validation & Onboarding Logic', () => {
  describe('loginSchema', () => {
    it('validates correct email and password', () => {
      const result = loginSchema.safeParse({
        email: 'wanderer@ember.game',
        password: 'secretpassword',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'secretpassword',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid email address.');
      }
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'wanderer@ember.game',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required.');
      }
    });
  });

  describe('signupSchema', () => {
    it('validates matching passwords with sufficient length', () => {
      const result = signupSchema.safeParse({
        email: 'wanderer@ember.game',
        password: 'longpassword123',
        confirmPassword: 'longpassword123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects short passwords (< 6 chars)', () => {
      const result = signupSchema.safeParse({
        email: 'wanderer@ember.game',
        password: '123',
        confirmPassword: '123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 6 characters long.');
      }
    });

    it('rejects mismatched confirm password', () => {
      const result = signupSchema.safeParse({
        email: 'wanderer@ember.game',
        password: 'securepassword1',
        confirmPassword: 'securepassword2',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Passwords do not match.');
      }
    });
  });

  describe('onboardingSchema & UTC handling', () => {
    it('validates UTC as a legitimate IANA timezone', () => {
      expect(isValidIanaTimezone('UTC')).toBe(true);
      const result = onboardingSchema.safeParse({ timezone: 'UTC' });
      expect(result.success).toBe(true);
    });

    it('validates global IANA timezones', () => {
      expect(isValidIanaTimezone('Asia/Kolkata')).toBe(true);
      expect(isValidIanaTimezone('America/New_York')).toBe(true);
      expect(isValidIanaTimezone('Europe/London')).toBe(true);
      expect(isValidIanaTimezone('Australia/Sydney')).toBe(true);

      const result = onboardingSchema.safeParse({ timezone: 'Asia/Kolkata' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid or blank timezone identifiers', () => {
      expect(isValidIanaTimezone('')).toBe(false);
      expect(isValidIanaTimezone('Fantasy/MiddleEarth')).toBe(false);

      const result = onboardingSchema.safeParse({ timezone: 'Fantasy/MiddleEarth' });
      expect(result.success).toBe(false);
    });
  });

  describe('isOnboardingComplete state evaluation', () => {
    it('returns false when preferences are empty or onboarded is false', () => {
      expect(isOnboardingComplete(null)).toBe(false);
      expect(isOnboardingComplete(undefined)).toBe(false);
      expect(isOnboardingComplete({})).toBe(false);
      expect(isOnboardingComplete({ onboarded: false })).toBe(false);
    });

    it('returns true when onboarded flag is explicitly true (even if timezone is UTC)', () => {
      expect(isOnboardingComplete({ onboarded: true })).toBe(true);
    });
  });
});