export interface UserPreferences {
  preferredLanguages: string[];
  favouriteSingers: string[];
  preferredGenres: string[];
  preferredMoods: string[];
  onboardingCompleted: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: UserProfile;
  token: string;
  expiresAt: number;
}

export interface AuthState {
  user: UserProfile | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
}
