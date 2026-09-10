import { useState } from 'react';
import { Loader2, ShieldCheck, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/AuthContext';
import { isAdminEmail } from '@/lib/authHelpers';
import { supabase } from '@/lib/supabase';

type Step = 'credentials' | 'admin_code';

export function LoginPage() {
  const { signIn } = useAuth();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [step, setStep] = useState<Step>('credentials');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const adminLogin = isAdminEmail(email);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (adminLogin) {
      // Admins: verify password first, then ask for secret code
      setSubmitting(true);
      const { error: signInError } = await signIn(email, password);
      setSubmitting(false);

      if (signInError) {
        setError(signInError);
        return;
      }

      // Password verified — now ask for the 4-digit secret code
      setStep('admin_code');
      return;
    }

    // Regular users: sign in directly (device verification handled in AuthContext)
    setSubmitting(true);
    const { error: signInError, needsDeviceVerification } = await signIn(email, password);
    setSubmitting(false);

    if (signInError) {
      setError(signInError);
      return;
    }

    if (needsDeviceVerification) {
      setNotice(
        'We detected a login from a new device. For your security, we sent a confirmation email to your registered email address. Please open it and click "I\'m the one" to verify this device, then log in again.',
      );
      return;
    }

    const next = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('next');
    navigate(next === '/admin' ? '/admin' : '/dashboard');
  };

  const handleAdminCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (secretCode.length !== 4) {
      setError('Please enter your 4-digit secret code.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError('Your session has expired. Please log in again.');
        setStep('credentials');
        setSubmitting(false);
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-secret-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'verify', secret_code: secretCode }),
      });
      const body = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setError(body.error ?? 'Verification failed');
        return;
      }

      if (body.valid) {
        const next = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('next');
        navigate(next === '/admin' ? '/admin' : '/admin');
      } else {
        setError(body.reason ?? 'Incorrect secret code');
      }
    } catch {
      setSubmitting(false);
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-700/20 blur-3xl" />
        <div className="absolute bottom-0 -right-32 h-80 w-80 rounded-full bg-amber-900/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md animate-[fadeIn_0.6s_ease-out]">
          <Link to="/" className="mb-8 flex items-center justify-center gap-3">
            <Logo size={48} />
            <div className="text-left">
              <p className="text-sm font-semibold tracking-wide text-stone-100">K.O AYODELE &amp; CO</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300/70">Client Portal</p>
            </div>
          </Link>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            {step === 'credentials' && (
              <>
                <h2 className="text-center text-2xl font-semibold text-stone-50">Welcome back</h2>
                <p className="mt-2 text-center text-sm text-stone-400">
                  Sign in to access your client dashboard.
                </p>

                <form onSubmit={handleCredentialsSubmit} className="mt-8 space-y-5">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                      Username / Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-white/10 bg-stone-900/50 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-white/10 bg-stone-900/50 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>

                  {adminLogin && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-900/20 px-4 py-2.5 text-xs text-amber-200">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>Admin account detected. You'll need your 4-digit secret code after password verification.</span>
                    </div>
                  )}

                  {error && (
                    <p className="rounded-lg border border-red-400/30 bg-red-900/30 px-4 py-2.5 text-sm text-red-200">
                      {error}
                    </p>
                  )}

                  {notice && (
                    <p className="rounded-lg border border-amber-400/30 bg-amber-900/20 px-4 py-2.5 text-sm text-amber-200">
                      {notice}
                    </p>
                  )}

                  <Button type="submit" variant="gold" fullWidth disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>

                <p className="mt-4 text-center text-sm text-stone-400">
                  <Link to="/forgot-password" className="font-medium text-amber-300 underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                </p>
              </>
            )}

            {step === 'admin_code' && (
              <>
                <div className="mb-6 flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
                    <Lock className="h-7 w-7 text-amber-300" />
                  </div>
                  <h2 className="text-center text-2xl font-semibold text-stone-50">Enter Secret Code</h2>
                  <p className="text-center text-sm text-stone-400">
                    Enter your 4-digit admin secret code to complete login.
                  </p>
                </div>

                <form onSubmit={handleAdminCodeSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="secretCode" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                      4-Digit Secret Code
                    </label>
                    <input
                      id="secretCode"
                      type="password"
                      inputMode="numeric"
                      pattern="\d{4}"
                      maxLength={4}
                      required
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full rounded-lg border border-white/10 bg-stone-900/50 px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-stone-100 placeholder-stone-600 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-400/30 bg-red-900/30 px-4 py-2.5 text-sm text-red-200">
                      {error}
                    </p>
                  )}

                  <Button type="submit" variant="gold" fullWidth disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Enter'}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <Link to="/admin-change-code" className="text-xs text-amber-300/70 underline-offset-4 hover:underline">
                    Need to change your secret code?
                  </Link>
                </div>

                <button
                  onClick={() => setStep('credentials')}
                  className="mt-4 w-full text-center text-sm text-stone-400 underline-offset-4 hover:text-stone-200 hover:underline"
                >
                  Back to login
                </button>
              </>
            )}

            <p className="mt-6 text-center text-sm text-stone-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-amber-300 underline-offset-4 hover:underline">
                Register here
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-[11px] text-stone-500">
            <Link to="/" className="hover:text-stone-300">← Back to home</Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px);} to { opacity:1; transform: translateY(0);} }`}</style>
    </div>
  );
}
