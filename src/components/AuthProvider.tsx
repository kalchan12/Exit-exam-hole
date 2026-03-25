'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface Profile {
  username: string;
  full_name: string;
  major: string;
  gender: string;
  avatar_url: string | null;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string, profileData: any) => Promise<{ error: string | null }>;
  signIn: (usernameOrEmail: string, password: string) => Promise<{ error: string | null }>;
  updateProfile: (profileData: Partial<Profile> & { avatarFile?: File }) => Promise<{ error: string | null }>;
  loginAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileLoading: false,
  isGuest: false,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  updateProfile: async () => ({ error: null }),
  loginAsGuest: () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const signingOutRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check local storage for guest mode
    if (typeof window !== 'undefined') {
      const guest = localStorage.getItem('isGuest') === 'true';
      setIsGuest(guest);
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // If there's an error like Invalid Refresh Token, clear session
        console.warn('Supabase session error:', error.message);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token');
        }
      }
      // Don't restore session if we're in the middle of signing out
      if (signingOutRef.current) {
        setLoading(false);
        return;
      }
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      }
      setLoading(false);
    }).catch((err) => {
      console.warn('Error fetching session:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Ignore all auth events while signing out to prevent re-login
        if (signingOutRef.current) {
          return;
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          const newUser = session.user;
          setUser(newUser);
          fetchProfile(newUser.id);
          setIsGuest(false);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('isGuest');
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, profileData: any) => {
    let avatarUrl = null;

    // 1. Upload avatar if provided
    if (profileData.avatarFile) {
      const fileExt = profileData.avatarFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, profileData.avatarFile);

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        avatarUrl = publicUrl;
      }
    }

    // 2. Sign up user and pass metadata for the trigger to pick up
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          username: profileData.username,
          full_name: profileData.fullName,
          major: profileData.major,
          gender: profileData.gender,
          avatar_url: avatarUrl,
        }
      }
    });
    
    if (authError) return { error: authError.message };
    if (!authData.user) return { error: 'Failed to create user' };

    return { error: null };
  }, []);

  const signIn = useCallback(async (usernameOrEmail: string, password: string) => {
    let emailToUse = usernameOrEmail;

    if (!usernameOrEmail.includes('@')) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', usernameOrEmail)
        .single();
        
      if (profileError || !profile || !profile.email) {
        return { error: 'Username not found' };
      }
      
      emailToUse = profile.email;
    }

    const { error } = await supabase.auth.signInWithPassword({ 
      email: emailToUse, 
      password 
    });
    
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const loginAsGuest = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isGuest', 'true');
    }
    setIsGuest(true);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(async (profileData: Partial<Profile> & { avatarFile?: File }) => {
    if (!user) return { error: 'No user logged in' };
    
    setProfileLoading(true);
    let avatarUrl = profileData.avatar_url;

    try {
      if (profileData.avatarFile) {
        const fileExt = profileData.avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, profileData.avatarFile);

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          setProfileLoading(false);
          return { error: `Failed to upload photo: ${uploadError.message}` };
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        avatarUrl = publicUrl;
      }

      const { avatarFile, ...updateData } = profileData;
      const finalUpdateData = {
        ...updateData,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(finalUpdateData)
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        setProfileLoading(false);
        return { error: profileError.message };
      }

      await fetchProfile(user.id);
      return { error: null };
    } catch (err: any) {
      console.error('Unexpected error during profile update:', err);
      return { error: err.message || 'An unexpected error occurred' };
    } finally {
      setProfileLoading(false);
    }
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    // 1. Set signing out flag to prevent auth listener from re-setting user
    signingOutRef.current = true;

    // 2. Clear all local state
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isGuest');
    }
    setIsGuest(false);
    setUser(null);
    setProfile(null);

    // 3. Clear session on Supabase FIRST, then redirect
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }

    // 4. Redirect to login after session is fully cleared
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      profileLoading, 
      isGuest, 
      signUp, 
      signIn, 
      updateProfile, 
      loginAsGuest, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
