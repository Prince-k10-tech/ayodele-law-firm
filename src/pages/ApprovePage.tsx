import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, CalendarDays, Clock, Mail } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Link, useRouter } from '@/lib/router';

export function ApprovePage() {
  const { path } = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [appt, setAppt] = useState<{
    full_name: string;
    case_subject: string;
    preferred_date: string;
    preferred_time: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const token = params.get('token');
    const action = params.get('action');

    if (!token || !action) {
      setStatus('error');
      setMessage('Invalid approval link. Please use the buttons in the appointment email.');
      return;
    }

    const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-appointment?token=${encodeURIComponent(token)}&action=${encodeURIComponent(action)}`;

    fetch(fnUrl)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setStatus('error');
          setMessage(body.error ?? 'Something went wrong.');
          return;
        }
        setStatus('success');
        setAppt(body.appointment);
        setMessage(
          body.message
            ? `This appointment was already ${body.appointment.status}.`
            : action === 'confirm'
              ? 'The appointment has been approved. A confirmation email has been sent to the client.'
              : 'The appointment has been cancelled. A notification email has been sent to the client.',
        );
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error. Please try again or use the admin dashboard.');
      });
  }, [path]);

  const isConfirm = path.includes('action=confirm');

  return (
    <div className="flex min-h-screen flex-col bg-stone-950 text-stone-100">
      <header className="border-b border-white/10 bg-stone-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4">
          <Logo size={36} />
          <div>
            <p className="text-sm font-semibold tracking-wide text-stone-100">K.O AYODELE &amp; CO</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300/70">Appointment Review</p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
              <p className="text-sm text-stone-400">
                {isConfirm ? 'Approving appointment…' : 'Cancelling appointment…'}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
              {isConfirm ? (
                <CheckCircle2 className="h-14 w-14 text-emerald-400" />
              ) : (
                <XCircle className="h-14 w-14 text-red-400" />
              )}
              <h1 className="text-xl font-semibold text-stone-50">
                {isConfirm ? 'Appointment Approved' : 'Appointment Cancelled'}
              </h1>
              <p className="text-sm text-stone-400">{message}</p>

              {appt && (
                <div className="mt-4 w-full rounded-xl border border-white/5 bg-stone-900/40 px-5 py-4 text-left text-sm">
                  <p className="font-semibold text-stone-200">{appt.case_subject}</p>
                  <div className="mt-2 space-y-1.5 text-stone-400">
                    <p className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-amber-300/60" />
                      {new Date(appt.preferred_date).toLocaleDateString('en-GB', {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-300/60" /> {appt.preferred_time}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-amber-300/60" /> {appt.full_name}
                    </p>
                  </div>
                </div>
              )}

              <Link
                to="/"
                className="mt-2 text-sm text-amber-300 underline-offset-4 hover:underline"
              >
                Return to website
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-400/30 bg-red-900/20 p-10 text-center">
              <XCircle className="h-14 w-14 text-red-400" />
              <h1 className="text-xl font-semibold text-red-200">Something went wrong</h1>
              <p className="text-sm text-red-300/80">{message}</p>
              <Link
                to="/"
                className="mt-2 text-sm text-amber-300 underline-offset-4 hover:underline"
              >
                Return to website
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-white/10 bg-stone-950 px-6 py-5">
        <p className="text-center text-[11px] leading-relaxed text-stone-600">
          25, Osolo Way, Off Airport Road, Ramotalahi Ayodele Memorial Plaza, Ajao Estate, Lagos State, Nigeria · 09017128358 · koayodeleandco@gmail.com
        </p>
      </footer>
    </div>
  );
}
