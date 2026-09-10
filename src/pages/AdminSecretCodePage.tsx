import { useState } from 'react';
import { Loader2, ShieldCheck, Lock, AlertTriangle, KeyRound } from 'lucide-react';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

type Step = 'why' | 'block' | 'new_code' | 'success';

export function AdminSecretCodePage() {
  const { user, loading } = useAuth();
  const { navigate } = useRouter();

  const [step, setStep] = useState<Step>('why');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!user) {
    navigate('/login?next=/admin-change-code');
    return null;
  }

  const handleBlock = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError('Your session has expired. Please log in again.');
        setSubmitting(false);
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-secret-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'block' }),
      });
      const body = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setError(body.error ?? 'Failed to initiate security check.');
        return;
      }

      setStep('block');
      setNotice(body.message ?? 'Security check initiated. The account has been blocked.');
    } catch {
      setSubmitting(false);
      setError('Network error. Please try again.');
    }
  };

  const handleChangeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newCode.length !== 4 || !/^\d{4}$/.test(newCode)) {
      setError('Secret code must be exactly 4 digits.');
      return;
    }
    if (newCode !== confirmCode) {
      setError('The codes do not match. Please try again.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError('Your session has expired. Please log in again.');
        setSubmitting(false);
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-secret-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'change',
          new_code: newCode,
          confirm_code: confirmCode,
        }),
      });
      const body = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setError(body.error ?? 'Failed to update secret code.');
        return;
      }

      setStep('success');
      setNotice(body.message ?? 'Secret code updated successfully.');
    } catch {
      setSubmitting(false);
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-stone-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <Logo size={36} />
            <div className="text-left">
              <p className="text-xs font-semibold tracking-wide text-stone-100 sm:text-sm">K.O AYODELE &amp; CO</p>
              <p className="text-[9px] uppercase tracking-[0.3em] text-amber-300/70 sm:text-[10px]">Change Secret Code</p>
            </div>
          </Link>
          <Link to="/admin" className="text-xs text-amber-300/70 underline-offset-4 hover:underline sm:text-sm">
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-stone-50 sm:text-3xl">Change Your Secret Code</h1>
          <p className="mt-2 text-sm text-stone-400">
            Why do you need to change your admin secret code?
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/30 bg-red-900/30 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-6 rounded-xl border border-emerald-400/30 bg-emerald-900/30 px-5 py-4 text-sm text-emerald-200">
            {notice}
          </div>
        )}

        {step === 'why' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={handleBlock}
              disabled={submitting}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-red-400/20 bg-red-900/10 p-6 text-left transition hover:border-red-400/40 hover:bg-red-900/20 disabled:opacity-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/15 text-red-300">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-stone-100">Account was logged into by someone else with another device</p>
                <p className="mt-1 text-sm text-stone-400">
                  We'll run a thorough security check and block the hacker immediately.
                </p>
              </div>
              {submitting && <Loader2 className="h-4 w-4 animate-spin text-red-300" />}
            </button>

            <button
              onClick={() => setStep('new_code')}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-900/10 p-6 text-left transition hover:border-amber-400/40 hover:bg-amber-900/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-stone-100">I need a new one</p>
                <p className="mt-1 text-sm text-stone-400">
                  Set a new 4-digit secret code for your admin account.
                </p>
              </div>
            </button>
          </div>
        )}

        {step === 'block' && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-400/30 bg-red-900/10 p-10 text-center">
            <ShieldCheck className="h-14 w-14 text-red-400" />
            <h2 className="text-xl font-semibold text-red-200">Security Check Complete</h2>
            <p className="max-w-sm text-sm text-red-300/80">
              Your account has been blocked to prevent unauthorized access. A security alert has been sent to all firm administrators.
              Please contact the firm to restore your access after identity verification.
            </p>
            <Link to="/" className="mt-2 text-sm text-amber-300 underline-offset-4 hover:underline">
              Return to website
            </Link>
          </div>
        )}

        {step === 'new_code' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-stone-50 sm:text-lg">Set New Secret Code</h2>
                <p className="text-xs text-stone-400">Choose a new 4-digit code for admin login.</p>
              </div>
            </div>

            <form onSubmit={handleChangeCode} className="space-y-5">
              <div>
                <label htmlFor="newCode" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                  New Secret Code
                </label>
                <input
                  id="newCode"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full rounded-lg border border-white/10 bg-stone-900/60 px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-stone-100 placeholder-stone-600 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <div>
                <label htmlFor="confirmCode" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                  Confirm New Code
                </label>
                <input
                  id="confirmCode"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  required
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full rounded-lg border border-white/10 bg-stone-900/60 px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-stone-100 placeholder-stone-600 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <Button type="submit" variant="gold" fullWidth disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save New Secret Code'}
              </Button>
            </form>

            <button
              onClick={() => setStep('why')}
              className="mt-4 w-full text-center text-sm text-stone-400 underline-offset-4 hover:text-stone-200 hover:underline"
            >
              Back
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-900/10 p-10 text-center">
            <ShieldCheck className="h-14 w-14 text-emerald-400" />
            <h2 className="text-xl font-semibold text-stone-50">Secret Code Updated</h2>
            <p className="text-sm text-stone-400">{notice}</p>
            <p className="text-sm text-stone-400">
              You'll use your new secret code the next time you log in as admin.
            </p>
            <Link to="/admin" className="mt-2">
              <Button variant="gold">Back to Dashboard</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
