import { useEffect, useState } from 'react';
import {
  CalendarDays,
  FileText,
  FolderUp,
  LogOut,
  CheckCircle2,
  Loader2,
  Clock,
  Inbox,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

type Appointment = {
  id: string;
  case_subject: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
};

type CaseSubmission = {
  id: string;
  case_title: string;
  case_category: string | null;
  file_name: string | null;
  status: string;
  created_at: string;
};

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

const CASE_CATEGORIES = [
  'Corporate & Commercial',
  'Litigation & Dispute Resolution',
  'Property & Real Estate',
  'Family Law',
  'Criminal Defense',
  'Estate & Probate',
  'Intellectual Property',
  'Other',
];

const ADMIN_EMAILS = ['koayodeleandco@gmail.com', 'iretomiwadada780@gmail.com'];

export function DashboardPage() {
  const { user, signOut, loading } = useAuth();
  const { navigate } = useRouter();

  const [activeTab, setActiveTab] = useState<'appointments' | 'cases'>('appointments');

  // Appointment form state
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptSubject, setApptSubject] = useState('');
  const [apptDetails, setApptDetails] = useState('');
  const [apptError, setApptError] = useState<string | null>(null);
  const [apptSuccess, setApptSuccess] = useState(false);
  const [apptLoading, setApptLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Case form state
  const [caseTitle, setCaseTitle] = useState('');
  const [caseCategory, setCaseCategory] = useState(CASE_CATEGORIES[0]);
  const [caseSummary, setCaseSummary] = useState('');
  const [caseFile, setCaseFile] = useState<File | null>(null);
  const [caseError, setCaseError] = useState<string | null>(null);
  const [caseSuccess, setCaseSuccess] = useState(false);
  const [caseLoading, setCaseLoading] = useState(false);
  const [cases, setCases] = useState<CaseSubmission[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    loadAppointments();
    loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const loadAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('id, case_subject, preferred_date, preferred_time, status')
      .order('created_at', { ascending: false });
    if (data) setAppointments(data as Appointment[]);
  };

  const loadCases = async () => {
    const { data } = await supabase
      .from('case_submissions')
      .select('id, case_title, case_category, file_name, status, created_at')
      .order('created_at', { ascending: false });
    if (data) setCases(data as CaseSubmission[]);
  };

  const fullName = (user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? user?.email ?? 'Client';
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;

  const handleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setApptError(null);
    setApptSuccess(false);
    if (!apptDate || !apptTime || !apptSubject) {
      setApptError('Please pick a date, a time slot, and add a subject.');
      return;
    }
    setApptLoading(true);
    const { data: inserted, error } = await supabase
      .from('appointments')
      .insert({
        full_name: fullName,
        email: user?.email,
        case_subject: apptSubject,
        case_details: apptDetails,
        preferred_date: apptDate,
        preferred_time: apptTime,
      })
      .select('id')
      .single();
    if (error) {
      setApptLoading(false);
      setApptError(error.message);
      return;
    }

    // Notify the firm for approval (fire-and-forget; non-blocking)
    try {
      const { data: session } = await supabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          appointment_id: inserted.id,
          full_name: fullName,
          email: user?.email,
          case_subject: apptSubject,
          case_details: apptDetails,
          preferred_date: apptDate,
          preferred_time: apptTime,
          app_url: window.location.origin,
        }),
      });
    } catch {
      // notification failure should not block the client's booking
    }

    setApptLoading(false);
    setApptSuccess(true);
    setApptSubject('');
    setApptDetails('');
    setApptDate('');
    setApptTime('');
    loadAppointments();
  };

  const handleCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCaseError(null);
    setCaseSuccess(false);
    if (!caseTitle || !caseSummary) {
      setCaseError('Please add a case title and summary.');
      return;
    }
    setCaseLoading(true);

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (caseFile) {
      const ext = caseFile.name.split('.').pop();
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('case-files').upload(path, caseFile, {
        upsert: false,
      });
      if (upErr) {
        setCaseLoading(false);
        setCaseError('Could not upload the file: ' + upErr.message);
        return;
      }
      fileUrl = path;
      fileName = caseFile.name;
    }

    const { data: insertedCase, error } = await supabase.from('case_submissions').insert({
      full_name: fullName,
      email: user?.email,
      case_title: caseTitle,
      case_category: caseCategory,
      case_summary: caseSummary,
      file_url: fileUrl,
      file_name: fileName,
    }).select('id').single();
    setCaseLoading(false);
    if (error) {
      setCaseError(error.message);
      return;
    }

    // Notify the firm about the new case (fire-and-forget; non-blocking)
    try {
      const { data: session } = await supabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-case`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          case_id: insertedCase.id,
          full_name: fullName,
          email: user?.email,
          case_title: caseTitle,
          case_category: caseCategory,
          case_summary: caseSummary,
          file_url: fileUrl,
          file_name: fileName,
          app_url: window.location.origin,
        }),
      });
    } catch {
      // notification failure should not block the case submission
    }

    setCaseSuccess(true);
    setCaseTitle('');
    setCaseSummary('');
    setCaseFile(null);
    loadCases();
  };

  const handleSignOut = async () => {
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

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-stone-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <Logo size={36} />
            <div className="text-left">
              <p className="text-xs font-semibold tracking-wide text-stone-100 sm:text-sm">K.O AYODELE &amp; CO</p>
              <p className="text-[9px] uppercase tracking-[0.3em] text-amber-300/70 sm:text-[10px]">Client Dashboard</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-stone-200">{fullName}</p>
              <p className="text-[11px] text-stone-500">{user?.email}</p>
            </div>
            {isAdmin && (
              <a
                href="#/admin"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 transition hover:bg-amber-500/20 sm:px-4 sm:text-sm"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </a>
            )}
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
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-semibold text-stone-50 sm:text-3xl">Client Dashboard</h1>
          <p className="mt-2 text-sm text-stone-400">
            Welcome back, {fullName}. Book a consultation or present your case to our legal team.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1 sm:mb-8 sm:inline-flex sm:w-auto">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition sm:px-5 sm:text-sm ${
              activeTab === 'appointments'
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-stone-900 shadow'
                : 'text-stone-300 hover:text-stone-100'
            }`}
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>Appointments</span>
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition sm:px-5 sm:text-sm ${
              activeTab === 'cases'
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-stone-900 shadow'
                : 'text-stone-300 hover:text-stone-100'
            }`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span>Case Presentation</span>
          </button>
        </div>

        {activeTab === 'appointments' ? (
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Scheduler form */}
            <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-sm sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-stone-50 sm:text-lg">Online Appointment Scheduling</h2>
                  <p className="text-xs text-stone-400">Pick a date and time that works for you.</p>
                </div>
              </div>

              <form onSubmit={handleAppointment} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="apptDate" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                      Preferred Date
                    </label>
                    <input
                      id="apptDate"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={apptDate}
                      onChange={(e) => setApptDate(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-stone-900/60 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                      Time Slot
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setApptTime(slot)}
                          className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                            apptTime === slot
                              ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                              : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20 hover:text-stone-200'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="apptSubject" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                    Case Subject
                  </label>
                  <input
                    id="apptSubject"
                    type="text"
                    value={apptSubject}
                    onChange={(e) => setApptSubject(e.target.value)}
                    placeholder="e.g. Contract review consultation"
                    className="w-full rounded-lg border border-white/10 bg-stone-900/60 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>

                <div>
                  <label htmlFor="apptDetails" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                    Brief Details <span className="text-stone-500 normal-case">(optional)</span>
                  </label>
                  <textarea
                    id="apptDetails"
                    rows={4}
                    value={apptDetails}
                    onChange={(e) => setApptDetails(e.target.value)}
                    placeholder="Share a short summary of what you'd like to discuss."
                    className="w-full resize-none rounded-lg border border-white/10 bg-stone-900/60 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>

                {apptError && (
                  <p className="rounded-lg border border-red-400/30 bg-red-900/30 px-4 py-2.5 text-sm text-red-200">{apptError}</p>
                )}
                {apptSuccess && (
                  <p className="rounded-lg border border-emerald-400/30 bg-emerald-900/30 px-4 py-2.5 text-sm text-emerald-200">
                    Appointment request submitted. Our team will confirm shortly.
                  </p>
                )}

                <Button type="submit" variant="gold" fullWidth disabled={apptLoading}>
                  {apptLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request Appointment'}
                </Button>
              </form>
            </section>

            {/* Appointments list */}
            <aside className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-sm sm:p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-200/80">
                <Clock className="h-4 w-4" /> Your Appointments
              </h3>
              {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Inbox className="mb-3 h-10 w-10 text-stone-600" />
                  <p className="text-sm text-stone-500">No appointments yet.</p>
                  <p className="text-xs text-stone-600">Book one using the form.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {appointments.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-xl border border-white/10 bg-stone-900/50 p-4 transition hover:border-amber-400/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-stone-100">{a.case_subject}</p>
                          <p className="mt-1 text-xs text-stone-400">
                            {new Date(a.preferred_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {'  ·  '}
                            {a.preferred_time}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                            a.status === 'confirmed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : a.status === 'cancelled'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Case form */}
            <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-sm sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-stone-50 sm:text-lg">Virtual Case Presentation</h2>
                  <p className="text-xs text-stone-400">Present the details of your case and attach supporting files.</p>
                </div>
              </div>

              <form onSubmit={handleCaseSubmit} className="space-y-5">
                <div>
                  <label htmlFor="caseTitle" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                    Case Title
                  </label>
                  <input
                    id="caseTitle"
                    type="text"
                    value={caseTitle}
                    onChange={(e) => setCaseTitle(e.target.value)}
                    placeholder="e.g. Breach of supply agreement"
                    className="w-full rounded-lg border border-white/10 bg-stone-900/60 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>

                <div>
                  <label htmlFor="caseCategory" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                    Practice Area
                  </label>
                  <select
                    id="caseCategory"
                    value={caseCategory}
                    onChange={(e) => setCaseCategory(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-stone-900/60 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                  >
                    {CASE_CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-stone-900">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="caseSummary" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                    Case Summary
                  </label>
                  <textarea
                    id="caseSummary"
                    rows={6}
                    value={caseSummary}
                    onChange={(e) => setCaseSummary(e.target.value)}
                    placeholder="Describe the facts, timeline, and the outcome you're seeking."
                    className="w-full resize-none rounded-lg border border-white/10 bg-stone-900/60 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>

                {/* File upload */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                    Supporting Document <span className="text-stone-500 normal-case">(optional)</span>
                  </label>
                  <label
                    htmlFor="caseFile"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-stone-900/40 px-4 py-6 text-center transition hover:border-amber-400/40 hover:bg-stone-900/70"
                  >
                    <FolderUp className="h-7 w-7 text-amber-300/70" />
                    <span className="text-sm text-stone-300">
                      {caseFile ? caseFile.name : 'Click to upload a file'}
                    </span>
                    <span className="text-[11px] text-stone-500">PDF, DOCX, or images up to 10MB</span>
                  </label>
                  <input
                    id="caseFile"
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => setCaseFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  {caseFile && (
                    <button
                      type="button"
                      onClick={() => setCaseFile(null)}
                      className="mt-2 text-xs text-stone-400 underline-offset-2 hover:text-stone-200 hover:underline"
                    >
                      Remove file
                    </button>
                  )}
                </div>

                {caseError && (
                  <p className="rounded-lg border border-red-400/30 bg-red-900/30 px-4 py-2.5 text-sm text-red-200">{caseError}</p>
                )}
                {caseSuccess && (
                  <p className="rounded-lg border border-emerald-400/30 bg-emerald-900/30 px-4 py-2.5 text-sm text-emerald-200">
                    Case submitted successfully. Our team will review and reach out.
                  </p>
                )}

                <Button type="submit" variant="gold" fullWidth disabled={caseLoading}>
                  {caseLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Case'}
                </Button>
              </form>
            </section>

            {/* Cases list */}
            <aside className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-sm sm:p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-200/80">
                <CheckCircle2 className="h-4 w-4" /> Submitted Cases
              </h3>
              {cases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Inbox className="mb-3 h-10 w-10 text-stone-600" />
                  <p className="text-sm text-stone-500">No cases submitted yet.</p>
                  <p className="text-xs text-stone-600">Use the form to present your case.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {cases.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-xl border border-white/10 bg-stone-900/50 p-4 transition hover:border-amber-400/30"
                    >
                      <p className="text-sm font-medium text-stone-100">{c.case_title}</p>
                      {c.case_category && (
                        <p className="mt-0.5 text-xs text-amber-300/70">{c.case_category}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                        <span>{c.file_name ? `📎 ${c.file_name}` : 'No attachment'}</span>
                        <CaseStatusBadge status={c.status} />
                      </div>
                      {c.status === 'approved' && (
                        <p className="mt-2 text-xs text-emerald-300/80">
                          Your case is being processed. Our team will contact you soon.
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 bg-stone-950 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center text-[11px] text-stone-500 sm:flex-row sm:text-left">
          <p className="inline-flex items-center gap-1.5">
            25, Osolo Way, Off Airport Road, Ramotalahi Ayodele Memorial Plaza, Ajao Estate, Lagos State, Nigeria
          </p>
          <p>
            09017128358 · koayodeleandco@gmail.com
          </p>
        </div>
      </footer>
    </div>
  );
}

function CaseStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    submitted: {
      label: 'Awaiting Review',
      className: 'bg-amber-500/15 text-amber-300',
    },
    viewed: {
      label: 'Viewed',
      className: 'bg-sky-500/15 text-sky-300',
    },
    approved: {
      label: 'Processing',
      className: 'bg-emerald-500/15 text-emerald-300',
    },
  };
  const cfg = config[status] ?? { label: status, className: 'bg-stone-500/15 text-stone-300' };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
