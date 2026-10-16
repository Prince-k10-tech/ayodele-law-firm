import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const { signIn } = useAuth();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);

    if (signInError) {
      setError(signInError);
      return;
    }


    const { data: authData } = await supabase.auth.getUser();
    const signedInUser = authData.user;
    const normalizedEmail = signedInUser?.email?.toLowerCase() ?? '';
    const appRole = signedInUser?.app_metadata?.role;
    const resolvedRole = appRole === 'superadmin' || appRole === 'moderator' || appRole === 'admin'
      ? appRole
      : normalizedEmail === 'iretomiwadada780@gmail.com'
        ? 'superadmin'
        : normalizedEmail === 'koayodeleandco@gmail.com'
          ? 'moderator'
          : 'user';
    const next = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('next');
    if (resolvedRole === 'superadmin' || resolvedRole === 'moderator' || resolvedRole === 'admin') {
      navigate('/admin');
    } else {
      navigate(next === '/account-setup' ? '/account-setup' : '/dashboard');
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
            <h2 className="text-center text-2xl font-semibold text-stone-50">Welcome back</h2>
            <p className="mt-2 text-center text-sm text-stone-400">
              Sign in to access your client dashboard.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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

              {error && (
                <p className="rounded-lg border border-red-400/30 bg-red-900/30 px-4 py-2.5 text-sm text-red-200">
                  {error}
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
