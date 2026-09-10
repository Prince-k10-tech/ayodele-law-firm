import { useState } from 'react';
import { Loader2, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/AuthContext';

type Step = 'details' | 'otp';

export function RegisterPage() {
  const { signUp, sendOtp, verifyOtp } = useAuth();
  const { navigate } = useRouter();

  const [step, setStep] = useState<Step>('details');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setError('A valid phone number is required for OTP verification.');
      return;
    }

    setSubmitting(true);
    const { error: signUpError } = await signUp(email, password, fullName, phone);
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    // Account created — now send OTP
    setSubmitting(true);
    const { error: otpError, deliveredVia } = await sendOtp(phone);
    setSubmitting(false);

    if (otpError) {
      setError(otpError);
      return;
    }

    setOtpSent(true);
    setNotice(
      'A 6-digit verification code has been sent to your email. Enter it below to complete your registration.',
    );
    setStep('otp');
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setSubmitting(true);
    const { error: verifyError } = await verifyOtp(otpCode, 'phone_verification');
    setSubmitting(false);

    if (verifyError) {
      setError(verifyError);
      return;
    }

    setNotice('Phone number verified successfully! Redirecting to your dashboard…');
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  const handleResendOtp = async () => {
    setError(null);
    setSubmitting(true);
    const { error: otpError } = await sendOtp(phone);
    setSubmitting(false);
    if (otpError) {
      setError(otpError);
      return;
    }
    setNotice('A new verification code has been sent.');
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
            {step === 'details' && (
              <>
                <h2 className="text-center text-2xl font-semibold text-stone-50">Create your account</h2>
                <p className="mt-2 text-center text-sm text-stone-400">
                  Register to book appointments and submit case details.
                </p>

                <form onSubmit={handleDetailsSubmit} className="mt-8 space-y-5">
                  <div>
                    <label htmlFor="fullName" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full rounded-lg border border-white/10 bg-stone-900/50 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                      Email
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
                    <label htmlFor="phone" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-300/50" />
                      <input
                        id="phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+234 801 234 5678"
                        className="w-full rounded-lg border border-white/10 bg-stone-900/50 px-4 py-3 pl-10 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-stone-500">
                      We'll send a verification code to your email to confirm your phone number.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-lg border border-white/10 bg-stone-900/50 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-400/30 bg-red-900/30 px-4 py-2.5 text-sm text-red-200">
                      {error}
                    </p>
                  )}

                  <Button type="submit" variant="gold" fullWidth disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
                  </Button>
                </form>
              </>
            )}

            {step === 'otp' && (
              <>
                <div className="mb-6 flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
                    <ShieldCheck className="h-7 w-7 text-amber-300" />
                  </div>
                  <h2 className="text-center text-2xl font-semibold text-stone-50">Verify Your Number</h2>
                  <p className="text-center text-sm text-stone-400">
                    Enter the 6-digit code sent to your email to complete registration.
                  </p>
                </div>

                {notice && (
                  <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-900/20 px-4 py-2.5 text-sm text-amber-200">
                    {notice}
                  </p>
                )}

                <form onSubmit={handleOtpSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="otpCode" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-amber-200/70">
                      Verification Code
                    </label>
                    <input
                      id="otpCode"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full rounded-lg border border-white/10 bg-stone-900/50 px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-stone-100 placeholder-stone-600 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-400/30 bg-red-900/30 px-4 py-2.5 text-sm text-red-200">
                      {error}
                    </p>
                  )}

                  <Button type="submit" variant="gold" fullWidth disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Complete'}
                  </Button>
                </form>

                <div className="mt-6 flex items-center justify-between text-sm">
                  <button
                    onClick={() => setStep('details')}
                    className="text-stone-400 underline-offset-4 hover:text-stone-200 hover:underline"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleResendOtp}
                    disabled={submitting}
                    className="text-amber-300 underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
              </>
            )}

            <p className="mt-6 text-center text-sm text-stone-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-amber-300 underline-offset-4 hover:underline">
                Login here
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
