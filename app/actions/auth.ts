'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema, onboardingSchema } from '@/lib/auth/validation';

export type AuthActionResult = {
  error?: string;
  successMessage?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function loginAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      error: 'Please fix the validation errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      error: error.message || 'Invalid email or password.',
    };
  }

  // Fetch profile to verify onboarding state
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone, preferences')
    .single();

  const preferences = (profile?.preferences as { onboarded?: boolean } | null) || {};
  const nextUrl = (formData.get('next') as string) || '';

  // Only redirect to /onboard if onboarding has not been completed
  if (!preferences.onboarded) {
    redirect('/onboard');
  }

  if (nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('//')) {
    redirect(nextUrl);
  }

  redirect('/hearth');
}

export async function signupAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  };

  const parsed = signupSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      error: 'Please fix the validation errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const origin = `${protocol}://${host}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return {
      error: error.message || 'Unable to create account. Please try again.',
    };
  }

  // If Supabase project requires email confirmation, session is null
  if (!data?.session) {
    return {
      successMessage:
        'Account created! A confirmation email has been sent. Please confirm your email before entering the Hearth.',
    };
  }

  redirect('/onboard');
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function completeOnboardingAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    timezone: formData.get('timezone'),
  };

  const parsed = onboardingSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      error: 'Please select a valid IANA timezone.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Authoritative PostgreSQL RPC update only — direct profiles table UPDATE is forbidden by RLS
  const { error: rpcError } = await supabase.rpc('update_profile_preferences', {
    p_timezone: parsed.data.timezone,
    p_preferences: { onboarded: true },
  });

  if (rpcError) {
    return {
      error: rpcError.message || 'Failed to save timezone preference.',
    };
  }

  redirect('/hearth');
}

export async function updatePreferencesAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const sound = formData.get('sound') === 'on' || formData.get('sound') === 'true';
  const reducedMotion =
    formData.get('reducedMotion') === 'on' || formData.get('reducedMotion') === 'true';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .single();

  const currentPrefs = (profile?.preferences as Record<string, unknown> | null) || {};
  const updatedPrefs = {
    ...currentPrefs,
    sound,
    reducedMotion,
  };

  const { error: rpcError } = await supabase.rpc('update_profile_preferences', {
    p_preferences: updatedPrefs,
  });

  if (rpcError) {
    return {
      error: rpcError.message || 'Failed to update preferences.',
    };
  }

  return {
    successMessage: 'Preferences saved successfully.',
  };
}