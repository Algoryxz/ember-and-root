import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export const signupSchema = z
  .object({
    email: z.string().trim().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
    confirmPassword: z.string().min(1, { message: 'Please confirm your password.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export function isValidIanaTimezone(tz: string): boolean {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function isOnboardingComplete(
  preferences: { onboarded?: boolean } | null | undefined
): boolean {
  return Boolean(preferences?.onboarded);
}

export const onboardingSchema = z.object({
  timezone: z
    .string()
    .trim()
    .min(1, { message: 'Timezone is required.' })
    .refine((tz) => isValidIanaTimezone(tz), {
      message: 'Invalid IANA timezone identifier (e.g. Asia/Kolkata, America/New_York, UTC).',
    }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;