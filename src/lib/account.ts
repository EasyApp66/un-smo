import { supabase } from '@/integrations/supabase/client';

export interface AccountStatus {
  signedIn: boolean;
  userEmail: string | null;
  access: boolean;
  role: 'admin' | 'user';
  paymentStatus: 'trial' | 'active' | 'past_due' | 'expired' | 'lifetime';
  trialDaysRemaining: number;
  trialEndsAt: string | null;
}

export const defaultAccountStatus: AccountStatus = {
  signedIn: false,
  userEmail: null,
  access: false,
  role: 'user',
  paymentStatus: 'trial',
  trialDaysRemaining: 7,
  trialEndsAt: null,
};

export const ensureProfile = async () => {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return false;
  const { data: existing } = await supabase.from('profiles').select('id').eq('user_id', userId).maybeSingle();
  if (!existing) await supabase.from('profiles').insert({ user_id: userId });
  return true;
};

export const fetchAccountStatus = async (): Promise<AccountStatus> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const email = sessionData.session?.user.email ?? null;
  if (!sessionData.session) return defaultAccountStatus;

  try {
    const { data, error } = await supabase.functions.invoke('account-status');
    if (error) throw error;
    return {
      signedIn: true,
      userEmail: email,
      access: !!data?.access,
      role: data?.role === 'admin' ? 'admin' : 'user',
      paymentStatus: data?.paymentStatus ?? 'trial',
      trialDaysRemaining: Math.max(0, Number(data?.trialDaysRemaining ?? 0)),
      trialEndsAt: data?.trialEndsAt ?? null,
    };
  } catch {
    await ensureProfile().catch(() => undefined);
    return { ...defaultAccountStatus, signedIn: true, userEmail: email, access: true };
  }
};

export const sendMagicLink = async (email: string) => {
  const redirectTo = window.location.origin;
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
  if (error) throw error;
};

export const signInWithApple = async () => {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin } });
  if (error) throw error;
};
