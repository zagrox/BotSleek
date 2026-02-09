import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { directus } from '../services/directus';
import { readMe, passwordRequest, passwordReset, createUser, readSingleton, updateMe, readItems, createItem, updateItem } from '@directus/sdk';
import { UserProfile } from '../types';

export interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar?: string | null;
  role?: any;
  profile?: UserProfile; // Attached profile data
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  requestReset: (email: string) => Promise<void>;
  confirmReset: (token: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<User> & { profileData?: Partial<UserProfile> }) => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_ROLE_ID = "968723f2-d383-4156-b7d9-c1ff6800d022";

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // 1. Fetch Basic User Data
      const currentUser = await directus.request(
        readMe({
          fields: ['id', 'first_name', 'last_name', 'email', 'avatar', 'role'],
        })
      );

      // 2. Fetch User Profile (from 'profile' collection)
      // @ts-ignore
      const profiles = await directus.request(readItems('profile', {
        filter: {
            user_created: { _eq: currentUser.id }
        },
        limit: 1
      }));

      let userProfile = profiles[0] as UserProfile | undefined;

      // 3. Auto Create Profile if not exists
      if (!userProfile) {
         try {
             // @ts-ignore
             userProfile = await directus.request(createItem('profile', {
                 status: 'published',
                 profile_official: false,
                 profile_company: 'My Company',
                 profile_color: '#3b82f6',
                 profile_chatbots: 0,
                 profile_messages: 0,
                 profile_storages: 0,
                 profile_llm: 0
             }));
         } catch (createErr) {
             console.error("Failed to auto-create profile:", createErr);
         }
      }

      // FIX: Use 'as unknown as User' to resolve strict type checking issues when Directus fields like avatar or role do not overlap with our interface
      setUser({ ...currentUser, profile: userProfile } as unknown as User);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await directus.login({ email, password });
      await checkAuth(); 
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err?.errors?.[0]?.message === 'Invalid user credentials.') {
        setError('Invalid email or password.');
      } else {
        setError('Login error. Please check your internet connection.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    try {
      let roleId = DEFAULT_ROLE_ID;
      try {
        const config = await directus.request(readSingleton('configuration')) as any;
        if (config && config.app_role) {
          roleId = String(config.app_role);
        }
      } catch (configErr) {
        console.warn("Could not fetch configuration for role ID, using default.", configErr);
      }

      await directus.request(createUser({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        role: roleId,
        status: 'active'
      }));

      await directus.login({ email: data.email, password: data.password });
      await checkAuth();
      
    } catch (err: any) {
      console.error("Registration failed:", err);
      if (err?.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
        setError('This email is already registered.');
      } else {
        setError('Registration error. Please check your inputs.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await directus.logout();
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const requestReset = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const resetUrl = typeof window !== 'undefined' ? window.location.origin : '';
      await directus.request(passwordRequest(email, resetUrl));
    } catch (err: any) {
      console.error("Request reset failed:", err);
      setError('Error sending recovery email. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async (token: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await directus.request(passwordReset(token, password));
    } catch (err: any) {
      console.error("Password reset failed:", err);
      setError('Error updating password. The reset link may have expired.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User> & { profileData?: Partial<UserProfile> }) => {
    try {
      const { profileData, ...userData } = data;
      let updatedUser = user;

      if (Object.keys(userData).length > 0) {
          const res = await directus.request(updateMe(userData));
          // FIX: Convert the spread object to unknown first before casting to User to bypass property incompatibility errors
          updatedUser = { ...updatedUser, ...res } as unknown as User;
      }

      if (profileData && user?.profile?.id) {
          // @ts-ignore
          const updatedProfile = await directus.request(updateItem('profile', user.profile.id, profileData));
          if (updatedUser) {
              updatedUser = { ...updatedUser, profile: updatedProfile as unknown as UserProfile };
          }
      }

      setUser(updatedUser);
      
    } catch (err: any) {
      console.error("Profile update failed:", err);
      throw err;
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, requestReset, confirmReset, updateProfile, refreshUser, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
