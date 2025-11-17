import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, currentSession: Session | null) => {
      setSession(currentSession);
      setLoading(false);

      // Handle session expiry
      if (event === 'TOKEN_REFRESHED') {
        console.log('Session refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: LoginCredentials) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Map Supabase errors to user-friendly messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address');
        }
        throw new Error(error.message || 'Login failed. Please try again.');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate all queries on successful login
      queryClient.invalidateQueries();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
  });
}

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}
