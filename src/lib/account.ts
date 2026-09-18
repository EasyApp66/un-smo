import { supabase } from '@/integrations/supabase/client';
import { localTrialActive, localTrialDaysRemaining } from '@/lib/localTrial';

export interface AccountStatus {
  signedIn: boolean;
  userEmail: string | null;
  access: boolean;
  role: 'admin' | 'user';
  paymentStatus: 'trial' | 'active' | 'past_due' | 'expired' | 'lifetime';
  trialDaysRemaining: number;
  trialEndsAt: string | null;
  /** Kaufdatum bei Lebenslang – nie ein Ablaufdatum. */
  paidSince: string | null;
}

/** Ohne Konto: alles lokal, Testzeit ab erstem Start. */
export const defaultAccountStatus: AccountStatus = {
  signedIn: false,
  userEmail: null,
  access: true,
  role: 'user',
  paymentStatus: 'trial',
  trialDaysRemaining: 7,
  trialEndsAt: null,
  paidSince: null,
};


const localStatus = (): AccountStatus => ({
  ...defaultAccountStatus,
  access: localTrialActive(),
  trialDaysRemaining: localTrialDaysRemaining(),
});

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
  if (!sessionData.session) return localStatus();

  const call = async () => {
    const { data, error } = await supabase.functions.invoke('account-status');
    if (error) throw error;
    return data;
  };

  let data: Record<string, unknown> | null = null;
  try {
    data = await call();
  } catch {
    // Einmal die Sitzung erneuern, dann still lokal weiterarbeiten – nie abmelden.
    try {
      await supabase.auth.refreshSession();
      data = await call();
    } catch {
      return { ...localStatus(), signedIn: true, userEmail: email };
    }
  }

  const role = (data as { role?: string } | null)?.role === 'admin' ? 'admin' : 'user';
  const serverAccess = !!(data as { access?: boolean } | null)?.access;
  return {
    signedIn: true,
    userEmail: email,
    access: role === 'admin' || serverAccess || localTrialActive(),
    role,
    paymentStatus:
      ((data as { paymentStatus?: AccountStatus['paymentStatus'] } | null)?.paymentStatus) ?? 'trial',
    trialDaysRemaining: Math.max(
      localTrialDaysRemaining(),
      Number((data as { trialDaysRemaining?: number } | null)?.trialDaysRemaining ?? 0),
    ),
    trialEndsAt: ((data as { trialEndsAt?: string } | null)?.trialEndsAt) ?? null,
  };
};

/** Sechsstelligen Code per E-Mail anfordern. */
export const sendEmailCode = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
};

/** Code in der App eingeben – die Sitzung entsteht genau hier. */
export const verifyEmailCode = async (email: string, token: string) => {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  await ensureProfile().catch(() => undefined);
};

/** Admin-Freischaltung über Code. */
export const adminUnlock = async (code: string) => {
  const { data, error } = await supabase.functions.invoke('admin-unlock', { body: { code } });
  if (error) throw error;
  const tokenHash = (data as { token_hash?: string } | null)?.token_hash;
  if (!tokenHash) throw new Error('kein Token');
  const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
  if (verifyError) throw verifyError;
};
