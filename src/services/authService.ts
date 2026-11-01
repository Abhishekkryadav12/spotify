import type { UserProfile, UserPreferences, AuthSession } from '../types/auth';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const LOCAL_USERS_KEY = 'soundwave_auth_users';
const CURRENT_SESSION_KEY = 'soundwave_auth_current_session';
const PASSWORD_RESET_CODES_KEY = 'soundwave_auth_reset_codes';

interface StoredUserRecord {
  id: string;
  name: string;
  email: string;
  saltHex: string;
  hashHex: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

// ---------------- Cryptographic Helpers (PBKDF2 + SHA-256) ----------------

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    256
  );

  return bufferToHex(derivedBits);
}

function generateSalt(): Uint8Array {
  const salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);
  return salt;
}

function generateToken(): string {
  const random = new Uint8Array(32);
  window.crypto.getRandomValues(random);
  return bufferToHex(random);
}

function generateUserId(): string {
  return 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

// ---------------- Local Database Helpers ----------------

function getStoredUsers(): Record<string, StoredUserRecord> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Failed to parse stored users:', e);
    return {};
  }
}

function saveStoredUsers(users: Record<string, StoredUserRecord>): void {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to save stored users:', e);
  }
}

function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(CURRENT_SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (session.expiresAt && session.expiresAt < Date.now()) {
      localStorage.removeItem(CURRENT_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveStoredSession(session: AuthSession | null): void {
  if (session) {
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }
}

// ---------------- Validation Functions ----------------

export const AuthValidator = {
  validateFullName(name: string): { valid: boolean; error?: string } {
    const trimmed = name.trim();
    if (!trimmed) {
      return { valid: false, error: 'Full name is required.' };
    }
    if (trimmed.length < 2) {
      return { valid: false, error: 'Name must be at least 2 characters.' };
    }
    return { valid: true };
  },

  validateEmail(email: string): { valid: boolean; error?: string } {
    const trimmed = email.trim();
    if (!trimmed) {
      return { valid: false, error: 'Email address is required.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }
    return { valid: true };
  },

  validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password) {
      return { valid: false, error: 'Password is required.' };
    }
    if (password.length < 6) {
      return { valid: false, error: 'Password must be at least 6 characters long.' };
    }
    return { valid: true };
  },
};

// ---------------- AuthService Implementation ----------------

const DEFAULT_PREFERENCES: UserPreferences = {
  preferredLanguages: [],
  favouriteSingers: [],
  preferredGenres: [],
  preferredMoods: [],
  onboardingCompleted: false,
};

export const AuthService = {
  /**
   * Check if Supabase cloud backend is configured
   */
  isSupabaseEnabled(): boolean {
    return isSupabaseConfigured;
  },

  /**
   * Register a new user
   */
  async signUp(fullName: string, email: string, password: string): Promise<UserProfile> {
    const nameCheck = AuthValidator.validateFullName(fullName);
    if (!nameCheck.valid) throw new Error(nameCheck.error);

    const emailCheck = AuthValidator.validateEmail(email);
    if (!emailCheck.valid) throw new Error(emailCheck.error);

    const passCheck = AuthValidator.validatePassword(password);
    if (!passCheck.valid) throw new Error(passCheck.error);

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Supabase Mode if configured
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Failed to create account. Please try again.');
      }

      const initialProfile: UserProfile = {
        id: data.user.id,
        name: fullName.trim(),
        email: normalizedEmail,
        preferences: { ...DEFAULT_PREFERENCES },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Persist profile to Supabase database
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: fullName.trim(),
          email: normalizedEmail,
          preferences: initialProfile.preferences,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Could not write to Supabase profiles table, saving locally:', e);
      }

      const session: AuthSession = {
        user: initialProfile,
        token: data.session?.access_token || generateToken(),
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
      };
      saveStoredSession(session);
      return initialProfile;
    }

    // 2. Cryptographic Local Mode
    const users = getStoredUsers();
    if (users[normalizedEmail]) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    const salt = generateSalt();
    const hashHex = await hashPassword(password, salt);
    const userId = generateUserId();

    const newRecord: StoredUserRecord = {
      id: userId,
      name: fullName.trim(),
      email: normalizedEmail,
      saltHex: bufferToHex(salt),
      hashHex,
      preferences: { ...DEFAULT_PREFERENCES },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users[normalizedEmail] = newRecord;
    saveStoredUsers(users);

    const profile: UserProfile = {
      id: newRecord.id,
      name: newRecord.name,
      email: newRecord.email,
      preferences: newRecord.preferences,
      createdAt: newRecord.createdAt,
      updatedAt: newRecord.updatedAt,
    };

    const session: AuthSession = {
      user: profile,
      token: generateToken(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
    };

    saveStoredSession(session);
    return profile;
  },

  /**
   * Log in existing user
   */
  async signIn(email: string, password: string): Promise<UserProfile> {
    const emailCheck = AuthValidator.validateEmail(email);
    if (!emailCheck.valid) throw new Error(emailCheck.error);

    if (!password) throw new Error('Password is required.');

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Supabase Mode if configured
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Invalid email or password.');
      }

      // Fetch profile from database
      let userPrefs: UserPreferences = { ...DEFAULT_PREFERENCES };
      let userName = (data.user.user_metadata?.full_name as string) || 'Music Lover';

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileData) {
          if (profileData.name) userName = profileData.name;
          if (profileData.preferences) userPrefs = profileData.preferences;
        }
      } catch (e) {
        console.warn('Could not read Supabase profiles table, checking local cache:', e);
        const cachedSession = getStoredSession();
        if (cachedSession?.user?.id === data.user.id) {
          userPrefs = cachedSession.user.preferences;
        }
      }

      const profile: UserProfile = {
        id: data.user.id,
        name: userName,
        email: normalizedEmail,
        preferences: userPrefs,
        createdAt: data.user.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const session: AuthSession = {
        user: profile,
        token: data.session?.access_token || generateToken(),
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
      };
      saveStoredSession(session);
      return profile;
    }

    // 2. Cryptographic Local Mode
    const users = getStoredUsers();
    const record = users[normalizedEmail];
    if (!record) {
      throw new Error('No account found with this email. Please check your spelling or sign up.');
    }

    const salt = hexToBuffer(record.saltHex);
    const computedHashHex = await hashPassword(password, salt);

    if (computedHashHex !== record.hashHex) {
      throw new Error('Incorrect password. Please try again or use Forgot Password.');
    }

    const profile: UserProfile = {
      id: record.id,
      name: record.name,
      email: record.email,
      preferences: record.preferences || { ...DEFAULT_PREFERENCES },
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    const session: AuthSession = {
      user: profile,
      token: generateToken(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
    };

    saveStoredSession(session);
    return profile;
  },

  /**
   * Log out active user
   */
  async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase sign out error:', e);
      }
    }
    saveStoredSession(null);
  },

  /**
   * Request password reset / verification code
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; code?: string; message: string }> {
    const emailCheck = AuthValidator.validateEmail(email);
    if (!emailCheck.valid) throw new Error(emailCheck.error);

    const normalizedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (error) throw new Error(error.message);
      return {
        success: true,
        message: 'Password reset link sent to your email address.',
      };
    }

    // Local mode: generate a 6-digit verification code
    const users = getStoredUsers();
    if (!users[normalizedEmail]) {
      throw new Error('No account found with this email address.');
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const codes = JSON.parse(localStorage.getItem(PASSWORD_RESET_CODES_KEY) || '{}');
      codes[normalizedEmail] = {
        code: resetCode,
        expiresAt: Date.now() + 1000 * 60 * 15, // 15 minutes
      };
      localStorage.setItem(PASSWORD_RESET_CODES_KEY, JSON.stringify(codes));
    } catch (e) {
      console.warn('Failed to store reset code:', e);
    }

    return {
      success: true,
      code: resetCode,
      message: `Password reset verification code: ${resetCode}`,
    };
  },

  /**
   * Reset password with verification code or direct update
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<boolean> {
    const emailCheck = AuthValidator.validateEmail(email);
    if (!emailCheck.valid) throw new Error(emailCheck.error);

    const passCheck = AuthValidator.validatePassword(newPassword);
    if (!passCheck.valid) throw new Error(passCheck.error);

    const normalizedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      return true;
    }

    // Verify reset code
    try {
      const codes = JSON.parse(localStorage.getItem(PASSWORD_RESET_CODES_KEY) || '{}');
      const record = codes[normalizedEmail];
      if (!record || record.code !== code.trim()) {
        throw new Error('Invalid verification code.');
      }
      if (record.expiresAt < Date.now()) {
        throw new Error('Verification code has expired. Please request a new one.');
      }
      // Remove used code
      delete codes[normalizedEmail];
      localStorage.setItem(PASSWORD_RESET_CODES_KEY, JSON.stringify(codes));
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error('Failed to verify reset code.');
    }

    // Update password with new salt
    const users = getStoredUsers();
    const user = users[normalizedEmail];
    if (!user) throw new Error('User not found.');

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    user.saltHex = bufferToHex(newSalt);
    user.hashHex = newHash;
    user.updatedAt = new Date().toISOString();

    users[normalizedEmail] = user;
    saveStoredUsers(users);

    return true;
  },

  /**
   * Get active session and current user profile
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    const session = getStoredSession();
    if (!session) return null;

    // Verify session user data against stored record
    const normalizedEmail = session.user.email.toLowerCase();
    const users = getStoredUsers();
    const record = users[normalizedEmail];
    if (record) {
      const updatedUser: UserProfile = {
        ...session.user,
        name: record.name,
        preferences: record.preferences,
      };
      return updatedUser;
    }

    return session.user;
  },

  /**
   * Save and persist updated user preferences
   */
  async saveUserPreferences(userId: string, newPreferences: Partial<UserPreferences>): Promise<UserProfile> {
    const session = getStoredSession();
    if (!session || session.user.id !== userId) {
      throw new Error('Active session not found or user mismatch.');
    }

    const updatedPreferences: UserPreferences = {
      ...session.user.preferences,
      ...newPreferences,
    };

    const updatedUser: UserProfile = {
      ...session.user,
      preferences: updatedPreferences,
      updatedAt: new Date().toISOString(),
    };

    // 1. Update Supabase if enabled
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('profiles')
          .update({
            preferences: updatedPreferences,
            updated_at: updatedUser.updatedAt,
          })
          .eq('id', userId);
      } catch (e) {
        console.warn('Could not update Supabase profiles table:', e);
      }
    }

    // 2. Update local stored user
    const users = getStoredUsers();
    const normalizedEmail = session.user.email.toLowerCase();
    if (users[normalizedEmail]) {
      users[normalizedEmail].preferences = updatedPreferences;
      users[normalizedEmail].updatedAt = updatedUser.updatedAt;
      saveStoredUsers(users);
    }

    // 3. Update session
    session.user = updatedUser;
    saveStoredSession(session);

    return updatedUser;
  },

  /**
   * Update basic profile info (e.g. display name)
   */
  async updateProfile(userId: string, updates: { name?: string }): Promise<UserProfile> {
    const session = getStoredSession();
    if (!session || session.user.id !== userId) {
      throw new Error('User not authenticated.');
    }

    if (updates.name) {
      const nameCheck = AuthValidator.validateFullName(updates.name);
      if (!nameCheck.valid) throw new Error(nameCheck.error);
    }

    const updatedUser: UserProfile = {
      ...session.user,
      name: updates.name ? updates.name.trim() : session.user.name,
      updatedAt: new Date().toISOString(),
    };

    // Update Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('profiles')
          .update({
            name: updatedUser.name,
            updated_at: updatedUser.updatedAt,
          })
          .eq('id', userId);
      } catch (e) {
        console.warn('Could not update Supabase profiles table:', e);
      }
    }

    // Update local store
    const users = getStoredUsers();
    const normalizedEmail = session.user.email.toLowerCase();
    if (users[normalizedEmail]) {
      if (updates.name) users[normalizedEmail].name = updates.name.trim();
      users[normalizedEmail].updatedAt = updatedUser.updatedAt;
      saveStoredUsers(users);
    }

    session.user = updatedUser;
    saveStoredSession(session);

    return updatedUser;
  },
};
