import { useCallback, useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  Clock,
  Mail,
  User,
  ShieldCheck,
  Inbox,
  FolderOpen,
  Eye,
  FileText,
  Download,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { StaffManagementPanel } from '@/components/StaffManagementPanel';

type Appointment = {
  id: string;
  full_name: string;
  email: string;
  case_subject: string;
  case_details: string | null;
  preferred_date: string;
  preferred_time: string;
  status: string;
  created_at: string;
};

type CaseSubmission = {
  id: string;
  full_name: string;
  email: string;
  case_title: string;
  case_category: string | null;
  case_summary: string | null;
  file_url: string | null;
  file_name: string | null;
  status: string;
  created_at: string;
};

const ADMIN_EMAILS = ['koayodeleandco@gmail.com'];

export function AdminPage() {
  const { user, loading, signOut, isSuperadmin, role } = useAuth();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<'appointments' | 'cases'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cases, setCases] = useState<CaseSubmission[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adminView, setAdminView] = useState(false);
  const [showStaffManagement, setShowStaffManagement] = useState(false);

  const isAdmin = role === 'admin' || role === 'moderator' || role === 'superadmin' || (user?.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false);

  const loadAppointments = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-appointments`, {
      headers: { Authorization: `Bearer ${session?.session?.access_token ?? ''}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `Failed to load appointments (${res.status})`);
    }
    const body = await res.json();
    setAppointments(body.appointments as Appointment[]);
  }, []);

  const loadCases = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-cases`, {
      headers: { Authorization: `Bearer ${session?.session?.access_token ?? ''}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `Failed to load cases (${res.status})`);
    }
    const body = await res.json();
    setCases(body.cases as CaseSubmission[]);
  }, []);

  const loadAll = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      await Promise.all([loadAppointments(), loadCases()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    }
    setFetching(false);
  }, [loadAppointments, loadCases]);

  useEffect(() => {
    setAdminView(sessionStorage.getItem('ko_admin_view') === 'superadmin-test');
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login?next=/admin');
      return;
    }
    if (!isAdmin) {
      setError('This area is restricted to authorized firm administrators.');
      setFetching(false);
      return;
    }
    loadAll();
  }, [user, loading, isAdmin, navigate, loadAll]);

  const handleAppointmentAction = async (id: string, action: 'confirm' | 'cancel') => {
    setActioningId(id);
    setNotice(null);
    const { data: session } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ appointmentId: id, action }),
    });
    setActioningId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Action failed');
      return;
    }
    setNotice(
      action === 'confirm'
        ? 'Appointment confirmed. A confirmation email has been sent to the client.'
        : 'Appointment cancelled. The client has been notified.',
    );
    loadAppointments();
  };

  const handleCaseAction = async (id: string, action: 'view' | 'approve') => {
    setActioningId(id);
    setNotice(null);
    const { data: session } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ caseId: id, action }),
    });
    setActioningId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Action failed');
      return;
    }
    setNotice(
      action === 'view'
        ? 'Case marked as viewed. The client will see "Viewed" on their dashboard.'
        : 'Case approved. The client has been notified that their case is being processed.',
    );
    loadCases();
  };

  const handleReturnToSuperadmin = () => {
    sessionStorage.removeItem('ko_admin_view');
    navigate('/superadmin');
  };

  const handleSignOut = async () => {
    sessionStorage.removeItem('ko_admin_view');
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const pendingAppts = appointments.filter((a) => a.status === 'pending');
  const confirmedAppts = appointments.filter((a) => a.status === 'confirmed');
  const cancelledAppts = appointments.filter((a) => a.status === 'cancelled');
  const newCases = cases.filter((c) => c.status === 'submitted');
  const viewedCases = cases.filter((c) => c.status === 'viewed');
  const approvedCases = cases.filter((c) => c.status === 'approved');

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {adminView && (
        <div className="sticky top-0 z-50 border-b border-amber-400/30 bg-amber-500/10 px-4 py-2.5 text-center text-xs text-amber-100 backdrop-blur">
          <span className="font-semibold">ADMIN VIEW — Testing as Administrator</span>
          <button onClick={handleReturnToSuperadmin} className="ml-3 rounded-md border border-amber-300/30 px-2.5 py-1 text-amber-200 hover:bg-amber-400/10">
            Return to Superadmin
          </button>
        </div>
      )}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-stone-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <Logo size={36} />
            <div className="text-left">
              <p className="text-xs font-semibold tracking-wide text-stone-100 sm:text-sm">K.O AYODELE &amp; CO</p>
              <p className="text-[9px] uppercase tracking-[0.3em] text-amber-300/70 sm:text-[10px]">Admin Dashboard</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {(role === 'superadmin' || role === 'moderator') && (
              <button
                onClick={() => setShowStaffManagement((current) => !current)}
                className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200 transition hover:bg-amber-400/10"
              >
                {showStaffManagement ? 'Close Staff' : 'Manage Staff'}
              </button>
            )}
            {isSuperadmin && (
              <button
                onClick={() => navigate('/superadmin')}
                className="hidden rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200 transition hover:bg-amber-400/10 sm:inline-flex"
              >
                Maintenance
              </button>
            )}
            <span className="hidden items-center gap-1.5 text-xs text-amber-200/70 sm:inline-flex">
              <ShieldCheck className="h-4 w-4" /> {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-stone-300 transition hover:border-red-400/30 hover:bg-red-900/20 hover:text-red-200 sm:px-4 sm:text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </div>
        </div>
        {showStaffManagement && (role === 'superadmin' || role === 'moderator') && (
          <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
            <StaffManagementPanel role={role} onClose={() => setShowStaffManagement(false)} />
          </div>
        )}
        {/* Tabs */}
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 sm:px-6">
          <TabButton
            active={tab === 'appointments'}
            onClick={() => setTab('appointments')}
            icon={<CalendarDays className="h-4 w-4" />}
            label="Appointments"
            badge={pendingAppts.length}
          />
          <TabButton
            active={tab === 'cases'}
            onClick={() => setTab('cases')}
            icon={<FolderOpen className="h-4 w-4" />}
            label="Case Presentations"
            badge={newCases.length}
          />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
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

        {tab === 'appointments' && (
          <>
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-stone-50 sm:text-3xl">Appointment Approvals</h1>
                <p className="mt-2 text-sm text-stone-400">
                  Review incoming client appointment requests and approve or cancel them.
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Stat label="Pending" value={pendingAppts.length} tone="amber" />
                <Stat label="Confirmed" value={confirmedAppts.length} tone="emerald" />
                <Stat label="Cancelled" value={cancelledAppts.length} tone="red" />
              </div>
            </div>

            {fetching ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
              </div>
            ) : appointments.length === 0 ? (
              <EmptyState icon={<Inbox className="mb-4 h-12 w-12 text-stone-600" />} title="No appointment requests yet." subtitle="New client bookings will appear here for approval." />
            ) : (
              <div className="space-y-4">
                {appointments.map((a) => (
                  <article key={a.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg transition hover:border-amber-400/20 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h3 className="text-sm font-semibold text-stone-50 sm:text-base">{a.case_subject}</h3>
                          <ApptStatusBadge status={a.status} />
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-stone-300 sm:grid-cols-2">
                          <span className="inline-flex items-center gap-2 text-stone-400"><User className="h-4 w-4 shrink-0 text-amber-300/60" /> <span className="truncate">{a.full_name}</span></span>
                          <span className="inline-flex items-center gap-2 text-stone-400"><Mail className="h-4 w-4 shrink-0 text-amber-300/60" /> <span className="truncate">{a.email}</span></span>
                          <span className="inline-flex items-center gap-2 text-stone-400"><CalendarDays className="h-4 w-4 shrink-0 text-amber-300/60" /> {new Date(a.preferred_date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="inline-flex items-center gap-2 text-stone-400"><Clock className="h-4 w-4 shrink-0 text-amber-300/60" /> {a.preferred_time}</span>
                        </div>
                        {a.case_details && <p className="mt-3 rounded-lg border border-white/5 bg-stone-900/40 px-4 py-3 text-sm text-stone-400">{a.case_details}</p>}
                      </div>
                      {a.status === 'pending' && (
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                          <button onClick={() => handleAppointmentAction(a.id, 'confirm')} disabled={actioningId === a.id} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 px-4 py-2.5 text-sm font-medium text-emerald-950 shadow transition hover:shadow-lg disabled:opacity-50">
                            {actioningId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Approve
                          </button>
                          <button onClick={() => handleAppointmentAction(a.id, 'cancel')} disabled={actioningId === a.id} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-400/30 bg-red-900/20 px-4 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-800/40 disabled:opacity-50">
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'cases' && (
          <>
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-stone-50 sm:text-3xl">Case Presentations</h1>
                <p className="mt-2 text-sm text-stone-400">
                  Review submitted cases. Mark as viewed or approve to begin processing.
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Stat label="New" value={newCases.length} tone="amber" />
                <Stat label="Viewed" value={viewedCases.length} tone="sky" />
                <Stat label="Processing" value={approvedCases.length} tone="emerald" />
              </div>
            </div>

            {fetching ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
              </div>
            ) : cases.length === 0 ? (
              <EmptyState icon={<FolderOpen className="mb-4 h-12 w-12 text-stone-600" />} title="No case submissions yet." subtitle="New client case presentations will appear here for review." />
            ) : (
              <div className="space-y-4">
                {cases.map((c) => (
                  <article key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg transition hover:border-amber-400/20 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h3 className="text-sm font-semibold text-stone-50 sm:text-base">{c.case_title}</h3>
                          <CaseStatusBadge status={c.status} />
                        </div>
                        {c.case_category && <p className="mt-1 text-xs text-amber-300/70">{c.case_category}</p>}
                        <div className="mt-3 grid gap-2 text-sm text-stone-300 sm:grid-cols-2">
                          <span className="inline-flex items-center gap-2 text-stone-400"><User className="h-4 w-4 shrink-0 text-amber-300/60" /> <span className="truncate">{c.full_name}</span></span>
                          <span className="inline-flex items-center gap-2 text-stone-400"><Mail className="h-4 w-4 shrink-0 text-amber-300/60" /> <span className="truncate">{c.email}</span></span>
                        </div>
                        {c.case_summary && (
                          <div className="mt-3 rounded-lg border border-white/5 bg-stone-900/40 px-4 py-3">
                            <p className="mb-1 text-[10px] uppercase tracking-wider text-stone-500">Case Summary</p>
                            <p className="text-sm whitespace-pre-wrap text-stone-400">{c.case_summary}</p>
                          </div>
                        )}
                        {c.file_name && c.file_url && (
                          <a href={c.file_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-amber-200 transition hover:bg-amber-500/10">
                            <Download className="h-3.5 w-3.5" />
                            {c.file_name}
                          </a>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        {c.status === 'submitted' && (
                          <>
                            <button onClick={() => handleCaseAction(c.id, 'view')} disabled={actioningId === c.id} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-900/20 px-4 py-2.5 text-sm font-medium text-sky-200 transition hover:bg-sky-800/40 disabled:opacity-50">
                              {actioningId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                              Mark Viewed
                            </button>
                            <button onClick={() => handleCaseAction(c.id, 'approve')} disabled={actioningId === c.id} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 px-4 py-2.5 text-sm font-medium text-emerald-950 shadow transition hover:shadow-lg disabled:opacity-50">
                              <CheckCircle2 className="h-4 w-4" />
                              Approve
                            </button>
                          </>
                        )}
                        {c.status === 'viewed' && (
                          <button onClick={() => handleCaseAction(c.id, 'approve')} disabled={actioningId === c.id} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 px-4 py-2.5 text-sm font-medium text-emerald-950 shadow transition hover:shadow-lg disabled:opacity-50">
                            {actioningId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Approve Case
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-white/10 bg-stone-950 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center text-[11px] text-stone-500 sm:flex-row sm:justify-between sm:text-left">
          <p>25, Osolo Way, Off Airport Road, Ramotalahi Ayodele Memorial Plaza, Ajao Estate, Lagos State, Nigeria</p>
          <p>09017128358 · koayodeleandco@gmail.com</p>
        </div>
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
        active ? 'text-amber-300' : 'text-stone-400 hover:text-stone-200'
      }`}
    >
      {icon}
      {label}
      {badge > 0 && (
        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
          {badge}
        </span>
      )}
      {active && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-amber-400 to-amber-600" />}
    </button>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'emerald' | 'red' | 'sky' }) {
  const tones = {
    amber: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
    emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
    red: 'border-red-400/30 bg-red-500/10 text-red-200',
    sky: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
  };
  return (
    <div className={`flex-1 rounded-xl border px-3 py-2 text-center sm:px-4 ${tones[tone]}`}>
      <p className="text-lg font-semibold sm:text-xl">{value}</p>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-20 text-center">
      {icon}
      <p className="text-sm text-stone-400">{title}</p>
      <p className="text-xs text-stone-600">{subtitle}</p>
    </div>
  );
}

function ApptStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'bg-emerald-500/20 text-emerald-300',
    cancelled: 'bg-red-500/20 text-red-300',
    pending: 'bg-amber-500/20 text-amber-300',
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${map[status] ?? 'bg-stone-500/20 text-stone-300'}`}>
      {status}
    </span>
  );
}

function CaseStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted: 'bg-amber-500/20 text-amber-300',
    viewed: 'bg-sky-500/20 text-sky-300',
    approved: 'bg-emerald-500/20 text-emerald-300',
  };
  const labels: Record<string, string> = {
    submitted: 'Awaiting Review',
    viewed: 'Viewed',
    approved: 'Processing',
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${map[status] ?? 'bg-stone-500/20 text-stone-300'}`}>
      {labels[status] ?? status}
    </span>
  );
}
