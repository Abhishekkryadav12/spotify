import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile, UserPreferences, AuthSession } from '../types/auth';
import { AuthService } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isSupabase: boolean;

  // Actions
  signUp: (fullName: string, email: string, password: string) => Promise<UserProfile>;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; code?: string; message: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<UserProfile>;
  updateProfile: (updates: { name?: string }) => Promise<UserProfile>;
  completeOnboarding: (preferences: UserPreferences) => Promise<void>;

  // Modal State Controls
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup' | 'forgot';
  openAuthModal: (mode?: 'signin' | 'signup' | 'forgot') => void;
  closeAuthModal: () => void;

  isOnboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;

  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Restore current session on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (isMounted && currentUser) {
          setUser(currentUser);
          // If logged in but hasn't completed onboarding, prompt onboarding
          if (!currentUser.preferences?.onboardingCompleted) {
            setIsOnboardingOpen(true);
          }
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const openAuthModal = useCallback((mode: 'signin' | 'signup' | 'forgot' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const openOnboarding = useCallback(() => {
    setIsOnboardingOpen(true);
  }, []);

  const closeOnboarding = useCallback(() => {
    setIsOnboardingOpen(false);
  }, []);

  const openProfileModal = useCallback(() => {
    setIsProfileModalOpen(true);
  }, []);

  const closeProfileModal = useCallback(() => {
    setIsProfileModalOpen(false);
  }, []);

  const signUp = useCallback(async (fullName: string, email: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const newUser = await AuthService.signUp(fullName, email, password);
      setUser(newUser);
      setIsAuthModalOpen(false);
      // New user always redirects to onboarding
      setIsOnboardingOpen(true);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const loggedUser = await AuthService.signIn(email, password);
      setUser(loggedUser);
      setIsAuthModalOpen(false);

      // If user hasn't completed onboarding yet, open onboarding; otherwise proceed to home
      if (!loggedUser.preferences?.onboardingCompleted) {
        setIsOnboardingOpen(true);
      }
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
      setSession(null);
      setIsProfileModalOpen(false);
      setIsOnboardingOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    return AuthService.requestPasswordReset(email);
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    return AuthService.resetPassword(email, code, newPassword);
  }, []);

  const updatePreferences = useCallback(async (newPreferences: Partial<UserPreferences>): Promise<UserProfile> => {
    if (!user) throw new Error('User not logged in');
    const updated = await AuthService.saveUserPreferences(user.id, newPreferences);
    setUser(updated);
    // Broadcast preferences change event for real-time recommendation updates
    window.dispatchEvent(new CustomEvent('soundwave_preferences_updated', { detail: updated.preferences }));
    return updated;
  }, [user]);

  const updateProfile = useCallback(async (updates: { name?: string }): Promise<UserProfile> => {
    if (!user) throw new Error('User not logged in');
    const updated = await AuthService.updateProfile(user.id, updates);
    setUser(updated);
    return updated;
  }, [user]);

  const completeOnboarding = useCallback(async (preferences: UserPreferences): Promise<void> => {
    if (!user) return;
    const finalPreferences: UserPreferences = {
      ...preferences,
      onboardingCompleted: true,
    };
    const updated = await AuthService.saveUserPreferences(user.id, finalPreferences);
    setUser(updated);
    setIsOnboardingOpen(false);
    window.dispatchEvent(new CustomEvent('soundwave_preferences_updated', { detail: finalPreferences }));
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: Boolean(user),
        isOnboarded: Boolean(user?.preferences?.onboardingCompleted),
        isSupabase: AuthService.isSupabaseEnabled(),
        signUp,
        signIn,
        signOut,
        requestPasswordReset,
        resetPassword,
        updatePreferences,
        updateProfile,
        completeOnboarding,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        isOnboardingOpen,
        openOnboarding,
        closeOnboarding,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
