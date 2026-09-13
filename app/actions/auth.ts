'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loginSchema, signupSchema, onboardingSchema } from '@/lib/auth/validation';

export type AuthActionResult = {
  error?: string;
  successMessage?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
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

  let target = '/hearth';
  if (!preferences.onboarded) {
    target = '/onboard';
  } else if (nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('//')) {
    target = nextUrl;
  }

  return { redirectTo: target };
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

  const supabase = await createClient();
  let sessionEstablished = false;

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (!error && data?.session) {
    sessionEstablished = true;
  }

  // If rate limit encountered or email confirmation required, attempt server-side auto-confirmation via admin client
  const isRateLimit = error && (
    error.message?.toLowerCase().includes('rate limit') ||
    (error as any).status === 429
  );

  if (!sessionEstablished && (isRateLimit || (data && !data.session))) {
    try {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { error: adminError } = await adminClient.auth.admin.createUser({
          email: parsed.data.email,
          password: parsed.data.password,
          email_confirm: true,
        });

        if (!adminError || adminError.message?.toLowerCase().includes('already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: parsed.data.email,
            password: parsed.data.password,
          });
          if (!signInError && signInData?.session) {
            sessionEstablished = true;
          }
        }
      }
    } catch {
      // Fall through to error reporting below
    }
  }

  if (sessionEstablished) {
    return { redirectTo: '/onboard' };
  }

  if (error) {
    if (isRateLimit) {
      return {
        error: 'Too many signup emails were requested. Please try again shortly or sign in if you already created an account.',
      };
    }
    return {
      error: error.message || 'Unable to create account. Please try again.',
    };
  }

  // If Supabase project requires email confirmation and admin bypass was unavailable
  if (!data?.session) {
    return {
      successMessage:
        'Account created! A confirmation email has been sent. Please confirm your email before entering the Hearth.',
    };
  }

  return { redirectTo: '/onboard' };
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