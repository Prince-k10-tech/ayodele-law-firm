import { useState } from 'react';
import { MailPlus, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type StaffRole = 'superadmin' | 'moderator';
type Props = { role: StaffRole; onClose: () => void };

export function StaffManagementPanel({ role, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const runAction = async (action: string, staffEmail?: string) => {
    setBusy(true);
    setError('');
    setNotice('');
    const { data, error: invokeError } = await supabase.functions.invoke('manage-staff', {
      body: { action, ...(staffEmail ? { email: staffEmail } : {}), ...(action === 'invite-client' ? { fullName: clientName.trim() } : {}) },
    });
    setBusy(false);
    if (invokeError || data?.error) {
      setError(data?.error ?? invokeError?.message ?? 'The request failed. Please try again.');
      return;
    }
    setNotice(data?.message ?? 'Request completed.');
    if (action === 'invite-admin' || action === 'invite-client') setEmail('');
    if (action === 'invite-client') setClientName('');
  };

  return (
    <section className="rounded-2xl border border-amber-400/20 bg-stone-900 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-200">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Staff access</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Invite staff as administrators. Invitations are emailed, and new staff must accept before signing in.
          </p>
          <p className="mt-2 text-xs text-stone-500">Your current role: {role}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close staff management" className="rounded-lg p-2 text-stone-400 hover:bg-white/5 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); if (email.trim()) void runAction('invite-admin', email.trim()); }}>
        <label className="sr-only" htmlFor="staff-email">Staff email address</label>
        <input id="staff-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="staff@example.com" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-stone-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/60" />
        <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-stone-950 disabled:opacity-50">
          <UserPlus className="h-4 w-4" /> Invite admin
        </button>
      </form>

      <div className="mt-5 border-t border-white/10 pt-5">
        <div className="flex items-center gap-2 text-amber-200"><Users className="h-5 w-5" /><h3 className="font-semibold">Create client portal</h3></div>
        <p className="mt-2 text-sm leading-6 text-stone-400">Send a secure account invitation. The client sets their own password from the email before using the client dashboard.</p>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); if (email.trim() && clientName.trim()) void runAction('invite-client', email.trim()); }}>
          <input type="text" required value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Client full name" className="min-w-0 rounded-xl border border-white/10 bg-stone-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/60" />
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="client@example.com" className="min-w-0 rounded-xl border border-white/10 bg-stone-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/60" />
          <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-200 disabled:opacity-50 sm:col-span-2"><Users className="h-4 w-4" /> Create client portal and send invite</button>
        </form>
      </div>

      {role === 'superadmin' && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-sm text-stone-300">Firm account</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">Assign the firm's main account the moderator role. Only the superadmin can do this.</p>
          <button type="button" disabled={busy} onClick={() => void runAction('set-firm-moderator')} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-stone-200 hover:bg-white/5 disabled:opacity-50">
            <MailPlus className="h-4 w-4" /> Configure firm moderator
          </button>
        </div>
      )}

      {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-200">{notice}</p>}
    </section>
  );
}
