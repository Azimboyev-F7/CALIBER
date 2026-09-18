import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthUser } from '../types';

// ─── Supabase client singleton ────────────────────────────────────────────────

let _client: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.startsWith('https://'));
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (_client) return _client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('[Supabase] Client NOT initialized — VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing from env');
    return null;
  }
  _client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  console.info('[Supabase] Client initialized:', url);
  return _client;
};

// ─── Demo user (kept for offline/demo mode) ───────────────────────────────────

export const DEMO_USER: AuthUser = {
  id: 'demo-student-uuid-2026',
  email: 'alex.chen@stanford.edu',
  username: 'alexchen',
  name: 'Alex Chen',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  created_at: new Date().toISOString(),
};

// ─── Local storage keys (sync cache + offline fallback) ───────────────────────

const LOCAL_AUTH_STORAGE_KEY = 'caliber_active_user';
const LOCAL_ACCOUNTS_STORAGE_KEY = 'caliber_saved_accounts';

interface SavedAccount {
  email: string;
  username?: string;
  password?: string;
  user: AuthUser;
  intendedMajor?: string;
  highSchool?: string;
}

const getSavedAccounts = (): SavedAccount[] => {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      const initial: SavedAccount[] = [
        {
          email: DEMO_USER.email,
          username: 'alexchen',
          password: 'password123',
          user: DEMO_USER,
          intendedMajor: 'Computer Science',
          highSchool: 'Saratoga High School',
        },
      ];
      localStorage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveAccount = (acc: SavedAccount) => {
  try {
    const list = getSavedAccounts().filter(
      (a) =>
        a.email.toLowerCase() !== acc.email.toLowerCase() &&
        (!a.username || a.username.toLowerCase() !== acc.username?.toLowerCase())
    );
    list.push(acc);
    localStorage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving account:', e);
  }
};

const refreshSavedAccount = (user: AuthUser) => {
  try {
    const accounts = getSavedAccounts();
    const existing = accounts.find((account) => account.user.id === user.id);
    const next = accounts.filter((account) => account.user.id !== user.id);
    next.push({
      ...(existing || {}),
      email: user.email,
      username: user.username,
      user,
    });
    localStorage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('Error refreshing cached account:', e);
  }
};

// ─── Auth user helpers ────────────────────────────────────────────────────────

export const mapSupabaseUser = (user: any): AuthUser | null => {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    id: user.id || `user-${Date.now()}`,
    email: user.email || '',
    username: meta.username || user.email?.split('@')[0],
    name: meta.name || meta.full_name || user.email?.split('@')[0] || 'Applicant',
    intendedMajor: meta.intendedMajor || undefined,
    highSchool: meta.highSchool || undefined,
    avatarUrl:
      meta.avatarUrl ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(meta.name || user.email || 'User')}`,
    created_at: user.created_at || new Date().toISOString(),
    role: meta.role,
  };
};

export const getStoredAuthUser = (): AuthUser | null => {
  try {
    const stored = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error loading stored user:', e);
  }
  return null;
};

export const setStoredAuthUser = (user: AuthUser | null) => {
  try {
    if (user) {
      localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Error saving stored user:', e);
  }
};

export interface AccountUpdate {
  email?: string;
  password?: string;
  name?: string;
  username?: string;
}

export const updateSupabaseAccount = async (
  updates: AccountUpdate
): Promise<{ user: AuthUser | null; error: string | null; emailChangePending: boolean }> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { user: null, error: 'Account updates are unavailable right now. Please try again later.', emailChangePending: false };
  }

  const payload: {
    email?: string;
    password?: string;
    data?: Record<string, string>;
  } = {};
  if (updates.email) payload.email = updates.email;
  if (updates.password) payload.password = updates.password;

  const metadata: Record<string, string> = {};
  if (updates.name !== undefined) metadata.name = updates.name;
  if (updates.username !== undefined) metadata.username = updates.username;
  if (Object.keys(metadata).length > 0) payload.data = metadata;

  try {
    const { data, error } = await supabase.auth.updateUser(payload);
    if (error) return { user: null, error: error.message, emailChangePending: false };
    const user = mapSupabaseUser(data.user);
    if (!user) return { user: null, error: 'Your account was updated, but the refreshed account data was unavailable.', emailChangePending: false };
    setStoredAuthUser(user);
    refreshSavedAccount(user);
    return {
      user,
      error: null,
      emailChangePending: Boolean((data.user as any)?.new_email),
    };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error.message : 'Could not update your account. Please try again.',
      emailChangePending: false,
    };
  }
};

// ─── Sign-in ──────────────────────────────────────────────────────────────────

export const signInWithIdentifier = async (
  identifier: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> => {
  const trimmed = identifier.trim().toLowerCase();
  if (!trimmed) return { user: null, error: 'Please enter your username or email address.' };
  if (!password) return { user: null, error: 'Please enter your password.' };

  const supabase = getSupabaseClient();
  const cachedAccount = getSavedAccounts().find(
    (account) =>
      account.email.toLowerCase() === trimmed ||
      (account.username || account.user.username || '').toLowerCase() === trimmed.replace(/^@/, '')
  );

  // Resolve username → email if needed
  let email = trimmed;
  if (!trimmed.includes('@')) {
    // Try local accounts first to find email from username
    const accounts = getSavedAccounts();
    const found = accounts.find(
      (a) => (a.username || a.user.username || '').toLowerCase() === trimmed.replace(/^@/, '')
    );
    if (found) {
      email = found.email.toLowerCase();
    } else {
      // Admin accounts use the stable Caliber account domain.
      email = `${trimmed.replace(/^@/, '')}@caliber.app`;
    }
  }

  if (supabase) {
    // Supabase is configured — use it exclusively
    console.info('[Supabase] Attempting sign-in for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[Supabase] Sign-in error:', error.message);
      return { user: null, error: error.message };
    }
    if (!data.user) {
      return { user: null, error: 'Sign-in failed. Please try again.' };
    }
    const authUser = mapSupabaseUser(data.user);
    if (!authUser) {
      return { user: null, error: 'Failed to load user profile. Please try again.' };
    }
    if (authUser && cachedAccount) {
      authUser.intendedMajor ||= cachedAccount.intendedMajor;
      authUser.highSchool ||= cachedAccount.highSchool;
    }
    console.info('[Supabase] Sign-in successful, user ID:', data.user.id);
    setStoredAuthUser(authUser);
    return { user: authUser, error: null };
  }

  // Supabase not configured — use localStorage only
  const savedAccounts = getSavedAccounts();
  const existing = savedAccounts.find((a) => a.email.toLowerCase() === email);
  if (!existing) return { user: null, error: 'No account found with that email. Please check your credentials or create an account.' };
  if (!existing.password) return { user: null, error: 'This account has no password set. Please reset your password.' };
  if (existing.password !== password) return { user: null, error: 'Invalid password. Please check your credentials.' };

  setStoredAuthUser(existing.user);
  return { user: existing.user, error: null };
};

export const signInWithEmail = signInWithIdentifier;

// ─── Sign-up ──────────────────────────────────────────────────────────────────

export const signUpWithEmail = async (
  email: string,
  password: string,
  metadata: { name: string; username?: string; intendedMajor?: string; highSchool?: string }
): Promise<{ user: AuthUser | null; error: string | null }> => {
  const trimmedEmail = email.trim();
  const rawUsername = metadata.username?.trim().replace(/^@/, '');
  const derivedUsername = rawUsername || trimmedEmail.split('@')[0] || metadata.name.toLowerCase().replace(/\s+/g, '');

  const supabase = getSupabaseClient();

  if (supabase) {
    // Supabase is configured — use it exclusively, surface any errors directly
    console.info('[Supabase] Attempting sign-up for:', trimmedEmail);
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          name: metadata.name.trim(),
          username: derivedUsername,
          intendedMajor: metadata.intendedMajor?.trim() || '',
          highSchool: metadata.highSchool?.trim() || '',
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(metadata.name || derivedUsername)}`,
        },
      },
    });

    if (error) {
      console.error('[Supabase] Sign-up error:', error.message);
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: 'Sign-up succeeded but no user returned. Check your Supabase email confirmation settings.' };
    }

    const authUser = mapSupabaseUser(data.user);
    if (!authUser) {
      return { user: null, error: 'Failed to map Supabase user. Please try again.' };
    }

    console.info('[Supabase] Sign-up successful, user ID:', data.user.id);
    // Cache locally for username lookups and offline sign-in fallback
    saveAccount({ email: trimmedEmail, username: derivedUsername, user: authUser, intendedMajor: metadata.intendedMajor, highSchool: metadata.highSchool });
    setStoredAuthUser(authUser);
    return { user: authUser, error: null };
  }

  // Supabase not configured (no env vars) — use localStorage only
  const savedAccounts = getSavedAccounts();
  if (savedAccounts.some((a) => a.email.toLowerCase() === trimmedEmail.toLowerCase())) {
    return { user: null, error: 'An account with this email address already exists. Please sign in instead.' };
  }
  if (savedAccounts.some((a) => (a.username || a.user.username || '').toLowerCase() === derivedUsername.toLowerCase())) {
    return { user: null, error: 'This username is already taken. Please choose a different username.' };
  }

  const newUser: AuthUser = {
    id: `applicant-${Date.now()}`,
    email: trimmedEmail,
    username: derivedUsername,
    name: metadata.name.trim() || derivedUsername,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(metadata.name || derivedUsername)}`,
    created_at: new Date().toISOString(),
  };

  saveAccount({ email: trimmedEmail, username: derivedUsername, password, user: newUser, intendedMajor: metadata.intendedMajor, highSchool: metadata.highSchool });
  setStoredAuthUser(newUser);
  return { user: newUser, error: null };
};

// ─── Sign-out ─────────────────────────────────────────────────────────────────

export const signOut = async (): Promise<void> => {
  const supabase = getSupabaseClient();
  if (supabase) {
    try { await supabase.auth.signOut(); } catch (e) { console.warn('[Supabase] Sign-out error:', e); }
  }
  setStoredAuthUser(null);
};

export const signOutUser = signOut;

// ─── Password reset ───────────────────────────────────────────────────────────

export const resetPassword = async (email: string): Promise<{ success: boolean; error: string | null }> => {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }
  return { success: false, error: 'Password recovery is unavailable. Please try again later.' };
};

// ─── Session restore on startup ───────────────────────────────────────────────
// Call this once from App.tsx (or let getStoredAuthUser handle it synchronously).
// Supabase restores its own session from its own localStorage key automatically.
// This helper syncs the Supabase session into our LOCAL_AUTH_STORAGE_KEY so
// getStoredAuthUser() keeps working synchronously.

export const getSessionToken = async (): Promise<string | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
};

export const syncSessionFromSupabase = async (): Promise<AuthUser | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return getStoredAuthUser();

  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const authUser = mapSupabaseUser(data.session.user);
      if (authUser) {
        setStoredAuthUser(authUser);
        return authUser;
      }
    }
  } catch (e) {
    console.warn('[Supabase] Could not restore session:', e);
  }

  setStoredAuthUser(null);
  return null;
};
