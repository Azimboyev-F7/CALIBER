import { AuthUser } from '../types';

export const DEMO_USER: AuthUser = {
  id: 'demo-student-uuid-2026',
  email: 'alex.chen@stanford.edu',
  name: 'Alex Chen',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  created_at: new Date().toISOString(),
};

// Local storage keys for session and account persistence
const LOCAL_AUTH_STORAGE_KEY = 'profilelens_active_user';
const LOCAL_ACCOUNTS_STORAGE_KEY = 'profilelens_saved_accounts';

interface SavedAccount {
  email: string;
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
    const list = getSavedAccounts().filter((a) => a.email.toLowerCase() !== acc.email.toLowerCase());
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

export const signInWithEmail = async (email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> => {
  const trimmedEmail = email.trim();
  const savedAccounts = getSavedAccounts();
  const existing = savedAccounts.find((a) => a.email.toLowerCase() === trimmedEmail.toLowerCase());

  if (existing) {
    if (existing.password && existing.password !== password) {
      return { user: null, error: 'Invalid password. Please check your credentials.' };
    }
    setStoredAuthUser(existing.user);
    return { user: existing.user, error: null };
  }

  // Create local session for applicant
  const newUser: AuthUser = {
    id: `applicant-${Date.now()}`,
    email: trimmedEmail,
    name: trimmedEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedEmail)}`,
    created_at: new Date().toISOString(),
  };

  saveAccount({ email: trimmedEmail, password, user: newUser });
  setStoredAuthUser(newUser);
  return { user: newUser, error: null };
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  metadata: { name: string; intendedMajor?: string; highSchool?: string }
): Promise<{ user: AuthUser | null; error: string | null }> => {
  const trimmedEmail = email.trim();
  const newUser: AuthUser = {
    id: `applicant-${Date.now()}`,
    email: trimmedEmail,
    name: metadata.name.trim() || trimmedEmail.split('@')[0],
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(metadata.name || trimmedEmail)}`,
    created_at: new Date().toISOString(),
  };

  saveAccount({
    email: trimmedEmail,
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
