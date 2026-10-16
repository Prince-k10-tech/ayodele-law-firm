import { useState } from 'react';
import { Loader2, Mail, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { Link } from '@/lib/router';
import { useAuth } from '@/lib/AuthContext';

type Step = 'details' | 'confirmation';

export function RegisterPage() {
  const { signUp, resendEmailConfirmation } = useAuth();
  const [step, setStep] = useState<Step>('details');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setError('Please enter a valid phone number for account contact.');
      return;
    }

    setSubmitting(true);
    const { error: signUpError } = await signUp(email.trim(), password, fullName.trim(), phone.trim());
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    setStep('confirmation');
    setNotice(`We created your account and sent a confirmation email to ${email.trim()}. Open that email and tap the confirmation link before signing in. Check Spam/Junk if it isn't in your inbox.`);
  };

  const handleResend = async () => {
    setError(null);
    setNotice(null);
    setSubmitting(true);
    const { error: resendError } = await resendEmailConfirmation(email.trim());
    setSubmitting(false);
    if (resendError) {
      setError(resendError);
      return;
    }
    setNotice(`We've requested a new confirmation email for ${email.trim()}. Check your inbox and Spam/Junk folder.`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-700/20 blur-3xl" />
        <div className="absolute bottom-0 -left-32 h-80 w-80 rounded-full bg-amber-900/10 blur-3xl" />
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
            {step === 'details' ? (
              <>
                <h2 className="text-center text-2xl font-semibold text-stone-50">Create your account</h2>
                <p className="mt-2 text-center text-sm text-stone-400">
                  Register to book appointments and submit case details.
                </p>

                <form onSubmit={handleDetailsSubmit} className="mt-8 space-y-5">
                  <div>
                    <label htmlFor="fullName" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">Full Name</label>
                    <input id="fullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe"
                      className="w-full rounded-lg border border-white/10 bg-stone-900/50 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20" />
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">Email address</label>
                    <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                      className="w-full rounded-lg border border-white/10 bg-stone-900/50 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20" />
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">Phone Number</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-300/50" />
                      <input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 801 234 5678"
                        className="w-full rounded-lg border border-white/10 bg-stone-900/50 px-4 py-3 pl-10 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20" />
                    </div>
                    <p className="mt-1.5 text-[11px] text-stone-500">Used for account contact. Email is the only verification method currently available.</p>
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">Password</label>
                    <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
                      className="w-full rounded-lg border border-white/10 bg-stone-900/50 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20" />
                  </div>

                  <div className="rounded-lg border border-amber-400/20 bg-amber-900/10 p-3 text-sm text-amber-100">
                    <div className="flex items-center gap-2 font-medium"><Mail className="h-4 w-4" /> Verification method: Email link</div>
                    <p className="mt-1 text-xs text-stone-300">After registration, we'll tell you clearly to check your email and provide a resend option.</p>
                  </div>

                  {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-900/30 px-4 py-2.5 text-sm text-red-200">{error}</p>}
                  <Button type="submit" variant="gold" fullWidth disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account & Verify Email'}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
                  <CheckCircle2 className="h-7 w-7 text-amber-300" />
                </div>
                <h2 className="text-2xl font-semibold text-stone-50">Check your email</h2>
                <p className="mt-3 text-sm leading-6 text-stone-300">{notice}</p>
                <p className="mt-3 text-xs leading-5 text-stone-400">Your account won't be ready to sign in until you confirm the email address. If the message doesn't arrive, check Spam/Junk and resend it below.</p>
                {error && <p role="alert" className="mt-4 rounded-lg border border-red-400/30 bg-red-900/30 px-4 py-2.5 text-sm text-red-200">{error}</p>}
                {notice && <p aria-live="polite" className="sr-only">{notice}</p>}
                <Button onClick={handleResend} variant="gold" fullWidth disabled={submitting} className="mt-6">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resend confirmation email'}
                </Button>
                <p className="mt-4 text-sm text-stone-400">Already confirmed it?</p>
                <Link to="/login" className="mt-1 inline-block font-medium text-amber-300 underline-offset-4 hover:underline">Continue to sign in</Link>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-stone-400">
              Already have an account? <Link to="/login" className="font-medium text-amber-300 underline-offset-4 hover:underline">Login here</Link>
            </p>
          </div>

          <p className="mt-6 text-center text-[11px] text-stone-500"><Link to="/" className="hover:text-stone-300">← Back to home</Link></p>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px);} to { opacity:1; transform: translateY(0);} }`}</style>
    </div>
  );
}
