import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';
import { getDeviceFingerprint, isAdminEmail } from './authHelpers';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; needsDeviceVerification?: boolean }>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  verifyOtp: (code: string, purpose?: string) => Promise<{ error: string | null }>;
  sendOtp: (phone: string) => Promise<{ error: string | null; deliveredVia?: string }>;
  isDeviceTrusted: () => Promise<boolean>;
  registerCurrentDevice: () => Promise<void>;
  isAdmin: boolean;
  isSuperadmin: boolean;
  role: 'superadmin' | 'admin' | 'user';
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        if (newSession?.user) {
          // Register or update device on each login
          try {
            const fp = getDeviceFingerprint();
            const { error } = await supabase.rpc('register_device', {
              p_fingerprint: fp,
              p_label: navigator.userAgent.slice(0, 80),
            });
            if (error) console.warn('Device registration failed:', error.message);
          } catch {
            // non-blocking
          }
        }
      })();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: 'Sign-in is temporarily unavailable because the authentication service has not been configured for this deployment.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    // After successful password auth, check device trust
    if (data.user && !isAdminEmail(data.user.email)) {
      try {
        const fp = getDeviceFingerprint();
        const { data: trusted } = await supabase.rpc('is_device_trusted', { p_fingerprint: fp });
        if (!trusted) {
          // New device — send verification email
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: data.user.email,
              app_url: window.location.origin,
            }),
          });
          // Sign the user out — they need to confirm from the email
          await supabase.auth.signOut();
          return {
            error: null,
            needsDeviceVerification: true,
          };
        }
      } catch {
        // If device check fails, allow login (fail open for usability)
      }
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    if (!isSupabaseConfigured) return { error: 'Account registration is temporarily unavailable because the authentication service has not been configured for this deployment.' };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    if (error) return { error: error.message };

    // Create user profile with phone number
    if (data.user) {
      const { error: profileErr } = await supabase.from('user_profiles').insert({
        id: data.user.id,
        phone,
        full_name: fullName,
        two_factor_enabled: true,
      });
      if (profileErr && !profileErr.message.includes('duplicate')) {
        return { error: 'Account created but profile setup failed: ' + profileErr.message };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  };

  const sendOtp = async (phone: string) => {
    if (!isSupabaseConfigured) return { error: 'OTP verification is unavailable until authentication is configured.' };
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { error: 'You must be logged in to request an OTP.' };

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone }),
      });
      const body = await res.json();
      if (!res.ok) return { error: body.error ?? 'Failed to send OTP' };
      return { error: null, deliveredVia: body.delivered_via };
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  };

  const verifyOtp = async (code: string, purpose = 'phone_verification') => {
    if (!isSupabaseConfigured) return { error: 'OTP verification is unavailable until authentication is configured.' };
    const { error } = await supabase.rpc('verify_otp', { p_code: code, p_purpose: purpose });
    if (error) return { error: error.message };
    return { error: null };
  };

  const isDeviceTrusted = async () => {
    if (!isSupabaseConfigured) return false;
    const fp = getDeviceFingerprint();
    const { data, error } = await supabase.rpc('is_device_trusted', { p_fingerprint: fp });
    if (error) return false;
    return data === true;
  };

  const registerCurrentDevice = async () => {
    if (!isSupabaseConfigured) throw new Error('Authentication is not configured for this deployment.');
    const fp = getDeviceFingerprint();
    const { error } = await supabase.rpc('register_device', {
      p_fingerprint: fp,
      p_label: navigator.userAgent.slice(0, 80),
    });
    if (error) throw error;
  };

  const role = (session?.user?.app_metadata?.role === 'superadmin' || session?.user?.app_metadata?.role === 'admin'
    ? session.user.app_metadata.role
    : isAdminEmail(session?.user?.email)
      ? 'admin'
      : 'user') as 'superadmin' | 'admin' | 'user';
  const isSuperadmin = role === 'superadmin';
  const isAdmin = role === 'superadmin' || role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        verifyOtp,
        sendOtp,
        isDeviceTrusted,
        registerCurrentDevice,
        isAdmin,
        isSuperadmin,
        role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
