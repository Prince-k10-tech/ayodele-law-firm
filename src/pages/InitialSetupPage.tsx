import { useEffect, useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from '@/lib/router';

export function InitialSetupPage() {
  const { user, loading, signOut } = useAuth();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/login?next=/initial-setup');
  }, [loading, user, navigate]);

  const bootstrap = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const { data, error: invokeError } = await supabase.functions.invoke('manage-staff', {
      body: { action: 'bootstrap-superadmin' },
    });
    setBusy(false);
    if (invokeError || data?.error) {
      setError(data?.error ?? invokeError?.message ?? 'Setup failed.');
      return;
    }
    setMessage(data?.message ?? 'Superadmin setup complete. Sign out and sign back in.');
  };

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-stone-950 text-amber-300"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const eligible = user.email?.toLowerCase() === 'iretomiwadada780@gmail.com' && Boolean(user.email_confirmed_at);
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-4 py-10 text-stone-100">
      <section className="w-full max-w-lg rounded-2xl border border-amber-400/20 bg-stone-900 p-6 sm:p-8">
        <ShieldCheck className="h-8 w-8 text-amber-300" />
        <h1 className="mt-4 text-xl font-semibold">Initial superadmin setup</h1>
        <p className="mt-2 text-sm leading-6 text-stone-400">This one-time setup is restricted to the verified owner email and is disabled after a superadmin exists.</p>
        <p className="mt-3 text-xs text-stone-500">Signed in as: {user.email ?? 'Unknown account'}</p>
        {!eligible && <p className="mt-4 text-sm text-amber-200">Sign in with the verified owner email to continue.</p>}
        <button type="button" disabled={!eligible || busy} onClick={() => void bootstrap()} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-stone-950 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Assign superadmin
        </button>
        <button type="button" onClick={async () => { await signOut(); navigate('/login'); }} className="ml-3 mt-5 rounded-xl border border-white/10 px-4 py-3 text-sm text-stone-300">Sign out</button>
        {error && <p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}
        {message && <p role="status" className="mt-4 text-sm text-emerald-200">{message}</p>}
      </section>
    </main>
  );
}
