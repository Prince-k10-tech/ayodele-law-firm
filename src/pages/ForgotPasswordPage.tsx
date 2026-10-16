import { useState, useEffect } from 'react';
import { Loader2, Mail, Lock, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { Link } from '@/lib/router';

type Step = 'request' | 'reset' | 'success';

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Check if we have a reset token in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    const token = params.get('token');
    const urlStep = params.get('step');
    if (token && urlStep === 'reset') {
      setStep('reset');
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setError(body.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setNotice(body.message ?? 'If an account exists with that email, a password reset link has been sent.');
    } catch {
      setSubmitting(false);
      setError('Network error. Please try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    const token = params.get('token');
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const body = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setError(body.error ?? 'Failed to reset password. Please try again.');
        return;
      }

      setStep('success');
      setNotice(body.message ?? 'Password updated successfully.');
    } catch {
      setSubmitting(false);
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-700/20 blur-3xl" />
        <div className="absolute bottom-0 -left-32 h-80 w-80 rounded-full bg-amber-900/10 blur-3xl" />
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
            {step === 'request' && (
              <>
                <div className="mb-6 flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
                    <KeyRound className="h-7 w-7 text-amber-300" />
                  </div>
                  <h2 className="text-center text-2xl font-semibold text-stone-50">Forgot Password</h2>
                  <p className="text-center text-sm text-stone-400">
                    Enter your registered email and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleRequestReset} className="space-y-5">
                  <div>
                    <label htmlFor="resetEmail" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                      Registered Email
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-300/50" />
                      <input
                        id="resetEmail"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-lg border border-white/10 bg-stone-900/50 px-4 py-3 pl-10 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-400/30 bg-red-900/30 px-4 py-2.5 text-sm text-red-200">
                      {error}
                    </p>
                  )}

                  {notice && (
                    <p className="rounded-lg border border-emerald-400/30 bg-emerald-900/20 px-4 py-2.5 text-sm text-emerald-200">
                      {notice}
                    </p>
                  )}

                  <Button type="submit" variant="gold" fullWidth disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-stone-400">
                  Remembered your password?{' '}
                  <Link to="/login" className="font-medium text-amber-300 underline-offset-4 hover:underline">
                    Login here
                  </Link>
                </p>
              </>
            )}

            {step === 'reset' && (
              <>
                <div className="mb-6 flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
                    <Lock className="h-7 w-7 text-amber-300" />
                  </div>
                  <h2 className="text-center text-2xl font-semibold text-stone-50">Set New Password</h2>
                  <p className="text-center text-sm text-stone-400">
                    Choose a new password for your account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label htmlFor="newPassword" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-lg border border-white/10 bg-stone-900/50 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full rounded-lg border border-white/10 bg-stone-900/50 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-400/30 bg-red-900/30 px-4 py-2.5 text-sm text-red-200">
                      {error}
                    </p>
                  )}

                  <Button type="submit" variant="gold" fullWidth disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset Password'}
                  </Button>
                </form>
              </>
            )}

            {step === 'success' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle2 className="h-14 w-14 text-emerald-400" />
                <h2 className="text-xl font-semibold text-stone-50">Password Changed</h2>
                <p className="text-sm text-stone-400">{notice}</p>
                <p className="text-sm text-stone-400">
                  You can now log in with your new password.
                </p>
                <Link to="/login" className="mt-2">
                  <Button variant="gold">Go to Login</Button>
                </Link>
              </div>
            )}
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
