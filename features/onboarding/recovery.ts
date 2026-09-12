/**
 * Recovery utilities for Onboarding V2 partial-Seal scenarios.
 *
 * Persists request IDs across page reloads so every network retry is
 * idempotent (same UUID → server returns prior mutation_receipts result).
 *
 * When the post-Seal `update_profile_preferences` call fails, a `sealPending`
 * record is written here so the next mount resumes at the retry UI instead of
 * restarting the entire onboarding flow.
 *
 * The record is cleared only when `preferences.onboarded === true` is
 * confirmed by the server.
 */
import type { MutationResult } from '@/game/contracts';
import type { OnboardingPreferences } from './types';

export const RECOVERY_KEY = 'onboarding_recovery_v2';

/**
 * Stored when `complete_quest` succeeds but `update_profile_preferences` fails.
 * Contains everything needed to retry the preference write without re-sealing.
 */
export interface SealPending {
  /** The authoritative MutationResult from the completed seal (for displaying rewards). */
  sealedResult: MutationResult;
  /** IANA timezone to persist on retry. */
  selectedTimezone: string;
  /** Full onboarding preferences to persist on retry. */
  onboardingPreferences: OnboardingPreferences;
}

/**
 * Full recovery record kept in localStorage while onboarding is in progress.
 */
export interface OnboardingRecovery {
  onboardingRequestId: string;
  firstSealRequestId: string;
  /** Map from StarterQuestTemplate.id → UUID used as p_request_id for create_quest. */
  questRequestIds: Record<string, string>;
  /** Present only when the seal is complete but the pref write has not yet been confirmed. */
  sealPending?: SealPending;
}

/** Read the current recovery record. Returns null if absent or unparseable. */
export function readRecovery(): OnboardingRecovery | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(RECOVERY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingRecovery;
  } catch {
    return null;
  }
}

/** Write a full recovery record, overwriting any prior value. */
export function writeRecovery(data: OnboardingRecovery): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(RECOVERY_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable (private mode, storage quota exceeded).
  }
}

/**
 * Merge a partial patch into the existing recovery record.
 * No-ops if no record exists (recovery is managed only after IDs are written on mount).
 */
export function updateRecovery(patch: Partial<OnboardingRecovery>): void {
  try {
    if (typeof window === 'undefined') return;
    const existing = readRecovery();
    if (!existing) return;
    writeRecovery({ ...existing, ...patch });
  } catch {
    // Safe to ignore.
  }
}

/**
 * Remove the recovery record after server-confirmed `preferences.onboarded === true`.
 * Must only be called once the RPC has returned without error.
 */
export function clearRecovery(): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(RECOVERY_KEY);
  } catch {
    // Safe to ignore.
  }
}
