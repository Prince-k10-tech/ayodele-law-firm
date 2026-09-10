import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
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
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    await supabase.auth.signOut();
  };

  const sendOtp = async (phone: string) => {
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
    const { error } = await supabase.rpc('verify_otp', { p_code: code, p_purpose: purpose });
    if (error) return { error: error.message };
    return { error: null };
  };

  const isDeviceTrusted = async () => {
    const fp = getDeviceFingerprint();
    const { data, error } = await supabase.rpc('is_device_trusted', { p_fingerprint: fp });
    if (error) return false;
    return data === true;
  };

  const registerCurrentDevice = async () => {
    const fp = getDeviceFingerprint();
    const { error } = await supabase.rpc('register_device', {
      p_fingerprint: fp,
      p_label: navigator.userAgent.slice(0, 80),
    });
    if (error) throw error;
  };

  const isAdmin = isAdminEmail(session?.user?.email);

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
