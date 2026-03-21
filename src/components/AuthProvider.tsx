'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string, profileData: any) => Promise<{ error: string | null }>;
  signIn: (usernameOrEmail: string, password: string) => Promise<{ error: string | null }>;
  loginAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGuest: false,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  loginAsGuest: () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

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
          localStorage.removeItem('supabase.auth.token'); // Or the specific token key if needed
        }
      }
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.warn('Error fetching session:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          // If we have a real user, we are definitely not a guest anymore
          setIsGuest(false);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('isGuest');
          }
        } else {
          setUser(null);
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
        // Continue signup even if upload fails, or you could return an error here
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

    // Note: Profile creation is now handled securely by a Postgres Trigger
    // configured in supabase_setup.sql down the line. We don't need to insert here.

    return { error: null };
  }, []);

  const signIn = useCallback(async (usernameOrEmail: string, password: string) => {
    let emailToUse = usernameOrEmail;

    // Check if it's NOT an email (basic check)
    if (!usernameOrEmail.includes('@')) {
      // Look up the email by username from the profiles table
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
  }, []);

  const signOut = useCallback(async () => {
    // 1. Clear local state instantly
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isGuest');
    }
    setIsGuest(false);
    setUser(null);

    // 2. Redirect immediately to login to avoid UI spinning
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }

    // 3. Clear session on Supabase without blocking the UI
    supabase.auth.signOut().catch(console.error);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, signUp, signIn, loginAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
