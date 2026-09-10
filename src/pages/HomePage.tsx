import { MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';

export function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-amber-700/20 blur-3xl" />
        <div className="absolute top-1/2 -right-32 h-[28rem] w-[28rem] rounded-full bg-amber-900/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-stone-600/10 blur-3xl" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(212,175,55,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.6) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-10 animate-[fadeInUp_0.8s_ease-out]">
            <Logo size={88} />
          </div>

          <p className="mb-3 text-xs font-medium uppercase tracking-[0.5em] text-amber-300/70 animate-[fadeInUp_0.8s_ease-out_0.1s_both]">
            Legal Practitioners &amp; Notaries Public
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-stone-50 sm:text-5xl md:text-6xl animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
            K.O AYODELE
            <span className="block bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              &amp; CO
            </span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-relaxed text-stone-400 animate-[fadeInUp_0.8s_ease-out_0.3s_both]">
            A distinguished law firm delivering trusted counsel, steadfast advocacy, and
            tailored legal solutions.
          </p>

          <div className="mt-14 flex flex-col gap-4 sm:flex-row sm:gap-6 animate-[fadeInUp_0.8s_ease-out_0.45s_both]">
            <Button to="/login" variant="gold">
              Login to Dashboard
            </Button>
            <Button to="/register" variant="outline">
              Register Account
            </Button>
          </div>
        </div>

        <footer className="w-full px-6 pb-6 pt-8 text-center">
          <div className="mx-auto mb-4 flex max-w-2xl flex-col items-center gap-2 text-[12px] text-stone-400 sm:flex-row sm:justify-center sm:gap-6">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-amber-400/70" />
              25, Osolo Way, Off Airport Road, Ramotalahi Ayodele Memorial Plaza, Ajao Estate, Lagos State, Nigeria
            </span>
          </div>
          <div className="mx-auto mb-3 flex max-w-2xl flex-col items-center gap-2 text-[12px] text-stone-400 sm:flex-row sm:justify-center sm:gap-6">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-amber-400/70" />
              09017128358
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-amber-400/70" />
              koayodeleandco@gmail.com
            </span>
          </div>
          <p className="text-[11px] text-stone-500">
            © {new Date().getFullYear()} K.O AYODELE &amp; CO. All rights reserved.
          </p>
        </footer>
      </main>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
