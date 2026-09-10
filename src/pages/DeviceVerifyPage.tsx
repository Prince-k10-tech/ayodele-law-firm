import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, ShieldAlert } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Link } from '@/lib/router';

type Status = 'loading' | 'success' | 'error' | 'denied';

export function DeviceVerifyPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1] ?? '');
    const token = params.get('token');
    const action = params.get('action');

    if (!token || !action) {
      setStatus('error');
      setMessage('Invalid verification link. Please use the buttons in the confirmation email.');
      return;
    }

    const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-verify?token=${encodeURIComponent(token)}&action=${encodeURIComponent(action)}`;

    fetch(fnUrl)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setStatus('error');
          setMessage(body.error ?? 'Something went wrong.');
          return;
        }
        if (action === 'deny') {
          setStatus('denied');
        } else {
          setStatus('success');
        }
        setMessage(body.message ?? '');
        if (body.email) setEmail(body.email);
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error. Please try again.');
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-stone-950 text-stone-100">
      <header className="border-b border-white/10 bg-stone-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4">
          <Logo size={36} />
          <div>
            <p className="text-sm font-semibold tracking-wide text-stone-100">K.O AYODELE &amp; CO</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300/70">Device Verification</p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
              <p className="text-sm text-stone-400">Verifying your device…</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-900/10 p-10 text-center">
              <CheckCircle2 className="h-14 w-14 text-emerald-400" />
              <h1 className="text-xl font-semibold text-stone-50">Device Confirmed</h1>
              <p className="text-sm text-stone-400">{message}</p>
              <p className="text-sm text-stone-400">
                You can now log in from this device.
              </p>
              <Link to="/login" className="mt-2 text-sm text-amber-300 underline-offset-4 hover:underline">
                Go to Login
              </Link>
            </div>
          )}

          {status === 'denied' && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-400/30 bg-red-900/20 p-10 text-center">
              <ShieldAlert className="h-14 w-14 text-red-400" />
              <h1 className="text-xl font-semibold text-red-200">Login Denied</h1>
              <p className="text-sm text-red-300/80">{message}</p>
              <Link to="/" className="mt-2 text-sm text-amber-300 underline-offset-4 hover:underline">
                Return to website
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-400/30 bg-red-900/20 p-10 text-center">
              <XCircle className="h-14 w-14 text-red-400" />
              <h1 className="text-xl font-semibold text-red-200">Something went wrong</h1>
              <p className="text-sm text-red-300/80">{message}</p>
              <Link to="/" className="mt-2 text-sm text-amber-300 underline-offset-4 hover:underline">
                Return to website
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-white/10 bg-stone-950 px-6 py-5">
        <p className="text-center text-[11px] leading-relaxed text-stone-600">
          25, Osolo Way, Off Airport Road, Ramotalahi Ayodele Memorial Plaza, Ajao Estate, Lagos State, Nigeria · 09017128358
        </p>
      </footer>
    </div>
  );
}
