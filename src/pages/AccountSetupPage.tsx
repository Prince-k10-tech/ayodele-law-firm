import { useEffect, useState } from 'react';
import { Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';

export function AccountSetupPage() {
  const { navigate } = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setHasSession(Boolean(data.session));
      setChecking(false);
    };
    void checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setHasSession(Boolean(session));
      setChecking(false);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setNotice('Your password is set. Your client portal is ready.');
    window.setTimeout(() => navigate('/dashboard'), 900);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 px-5 py-12 text-stone-100">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
        <div className="mb-7 flex items-center justify-center gap-3">
          <Logo size={44} />
          <div><p className="text-sm font-semibold">K.O AYODELE &amp; CO</p><p className="text-[10px] uppercase tracking-[0.25em] text-amber-300/70">Client Portal Setup</p></div>
        </div>
        <div className="mb-5 flex justify-center"><div className="rounded-full border border-amber-400/20 bg-amber-400/10 p-3 text-amber-200"><LockKeyhole className="h-6 w-6" /></div></div>
        <h1 className="text-center text-2xl font-semibold">Set your password</h1>
        <p className="mt-2 text-center text-sm leading-6 text-stone-400">Create a secure password to activate the client portal invited by the firm.</p>
        {checking ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-amber-300" /></div> : !hasSession ? (
          <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-6 text-stone-300">
            This setup link has no active invitation session. Open the newest invitation email from K.O AYODELE &amp; CO on this device. If the link has expired, ask the firm to send a new invitation.
            <button type="button" onClick={() => navigate('/login')} className="mt-4 block font-medium text-amber-200 underline">Go to sign in</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">New password</span><input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-white/10 bg-stone-950/70 px-4 py-3 text-sm outline-none focus:border-amber-400/50" placeholder="At least 8 characters" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">Confirm password</span><input type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border border-white/10 bg-stone-950/70 px-4 py-3 text-sm outline-none focus:border-amber-400/50" placeholder="Enter the password again" /></label>
            {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200">{error}</p>}
            {notice && <p role="status" className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-200"><ShieldCheck className="mr-2 inline h-4 w-4" />{notice}</p>}
            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-semibold text-stone-950 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Set password and activate portal</button>
          </form>
        )}
      </section>
    </main>
  );
}
