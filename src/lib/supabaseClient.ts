import { AuthUser } from '../types';

export const DEMO_USER: AuthUser = {
  id: 'demo-student-uuid-2026',
  email: 'alex.chen@stanford.edu',
  username: 'alexchen',
  name: 'Alex Chen',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  created_at: new Date().toISOString(),
};

// Local storage keys for session and account persistence
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
      // Seed initial demo account
      const initial: SavedAccount[] = [
        {
          email: DEMO_USER.email,
          username: 'alexchen',
          password: 'password123',
          user: DEMO_USER,
          intendedMajor: 'Computer Science',
          highSchool: 'Saratoga High School'
        }
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
      (a) => a.email.toLowerCase() !== acc.email.toLowerCase() &&
             (!a.username || a.username.toLowerCase() !== acc.username?.toLowerCase())
    );
    list.push(acc);
    localStorage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving account:', e);
  }
};

export const isSupabaseConfigured = (): boolean => {
  return true;
};

export const getSupabaseClient = (): any => {
  return null;
};

export const mapSupabaseUser = (user: any): AuthUser | null => {
  if (!user) return null;
  return {
    id: user.id || `user-${Date.now()}`,
    email: user.email || '',
    username: user.username || user.email?.split('@')[0],
    name: user.name || user.email?.split('@')[0] || 'Applicant',
    avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email || 'User')}`,
    created_at: user.created_at || new Date().toISOString(),
  };
};

export const getStoredAuthUser = (): AuthUser | null => {
  try {
    const stored = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
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

// Allows signing in with either email or username
export const signInWithIdentifier = async (
  identifier: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> => {
  const trimmed = identifier.trim().toLowerCase();
  if (!trimmed) {
    return { user: null, error: 'Please enter your username or email address.' };
  }

  if (!password) {
    return { user: null, error: 'Please enter your password.' };
  }

  const savedAccounts = getSavedAccounts();
  const existing = savedAccounts.find((a) => {
    const accountEmail = a.email.toLowerCase();
    const accountUsername = (a.username || a.user.username || '').toLowerCase();
    const cleanIdentifier = trimmed.replace(/^@/, '');

    return accountEmail === trimmed || accountUsername === cleanIdentifier;
  });

  if (!existing) {
    return {
      user: null,
      error: 'No account found with that username or email. Please check your credentials or create an account.',
    };
  }

  if (existing.password && existing.password !== password) {
    return { user: null, error: 'Invalid password. Please check your credentials.' };
  }

  setStoredAuthUser(existing.user);
  return { user: existing.user, error: null };
};

// Backwards compatibility alias
export const signInWithEmail = signInWithIdentifier;

export const signUpWithEmail = async (
  email: string,
  password: string,
  metadata: { name: string; username?: string; intendedMajor?: string; highSchool?: string }
): Promise<{ user: AuthUser | null; error: string | null }> => {
  const trimmedEmail = email.trim();
  const rawUsername = metadata.username?.trim().replace(/^@/, '');
  const derivedUsername = rawUsername || trimmedEmail.split('@')[0] || metadata.name.toLowerCase().replace(/\s+/g, '');

  const savedAccounts = getSavedAccounts();
  const emailExists = savedAccounts.some((a) => a.email.toLowerCase() === trimmedEmail.toLowerCase());
  const usernameExists = savedAccounts.some(
    (a) => (a.username || a.user.username || '').toLowerCase() === derivedUsername.toLowerCase()
  );

  if (emailExists) {
    return { user: null, error: 'An account with this email address already exists. Please sign in instead.' };
  }

  if (usernameExists) {
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

  saveAccount({
    email: trimmedEmail,
    username: derivedUsername,
    password,
    user: newUser,
    intendedMajor: metadata.intendedMajor,
    highSchool: metadata.highSchool,
  });

  setStoredAuthUser(newUser);
  return { user: newUser, error: null };
};

export const signOut = async (): Promise<void> => {
  setStoredAuthUser(null);
};

export const signOutUser = async (): Promise<void> => {
  setStoredAuthUser(null);
};

export const resetPassword = async (email: string): Promise<{ success: boolean; error: string | null }> => {
  return { success: true, error: null };
};
