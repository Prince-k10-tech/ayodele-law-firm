import { Activity, ArrowLeft, CheckCircle2, LogOut, ShieldCheck, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';

export function SuperadminPage() {
  const { user, loading, isSuperadmin, signOut } = useAuth();
  const { navigate } = useRouter();
  const [status, setStatus] = useState('Checking session…');
  const [bootstrapping, setBootstrapping] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login?next=/superadmin');
      return;
    }
    if (!isSuperadmin) {
      navigate('/admin');
      return;
    }
    setStatus('Authenticated as superadmin');
  }, [loading, user, isSuperadmin, navigate]);

  const activateSuperadmin = async () => {
    setBootstrapping(true);
    setStatus('Assigning your protected superadmin role…');
    const { data, error } = await supabase.functions.invoke('manage-staff', { body: { action: 'bootstrap-superadmin' } });
    if (error || data?.error) {
      setStatus(data?.error ?? error?.message ?? 'Could not assign the superadmin role.');
      setBootstrapping(false);
      return;
    }
    await supabase.auth.refreshSession();
    setStatus(data?.message ?? 'Superadmin role assigned.');
    setBootstrapping(false);
  };

  const enterAdminView = () => {
    sessionStorage.setItem('ko_admin_view', 'superadmin-test');
    navigate('/admin');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || !user || !isSuperadmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <Activity className="h-8 w-8 animate-pulse text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-white/10 bg-stone-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2">
              <Wrench className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h1 className="font-semibold">Superadmin Maintenance</h1>
              <p className="text-xs text-stone-500">K.O AYODELE &amp; CO</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-stone-300 hover:bg-white/5">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-amber-300" />
            <div>
              <h2 className="text-lg font-semibold">Maintenance access</h2>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                This area is for diagnosing and maintaining the application. Normal client and firm data is not listed here by default.
              </p>
              <p className="mt-3 text-xs text-stone-500">{status} · {user.email}</p>
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Secure superadmin setup</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
            Register your account's protected superadmin role in Supabase. This action is restricted by the server to the designated owner account and only works if no other superadmin is already configured.
          </p>
          <button
            onClick={() => void activateSuperadmin()}
            disabled={bootstrapping}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 disabled:opacity-50"
          >
            {bootstrapping ? 'Setting up…' : 'Initialize Super Admin Role'}
          </button>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Test the normal administrator experience</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
            Open the exact normal Admin Dashboard as a temporary test view. Your superadmin role is not changed, and you can return here at any time.
          </p>
          <button
            onClick={enterAdminView}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-300"
          >
            <CheckCircle2 className="h-4 w-4" />
            Switch to Admin View
          </button>
        </section>

        <button onClick={() => navigate('/')} className="mt-6 inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-300">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </button>
      </main>
    </div>
  );
}
