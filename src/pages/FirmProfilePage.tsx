import {
  MapPin,
  Phone,
  Mail,
  Building2,
  Scale,
  Briefcase,
  FileText,
  Gavel,
  Users,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/Button';
import { Link } from '@/lib/router';

const heroImage =
  'https://images.pexels.com/photos/6077091/pexels-photo-6077091.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

const secretarialServices = [
  'Preparation and circulation of Notices of Company/Board meetings and Minutes and Resolutions in relation thereto.',
  'Attending Company/Board meetings and preparing Minutes.',
  'Maintenance of statutory Registers, Minutes books and keeping corporate seals.',
  'Filing of Annual Returns and other Returns required to record changes in Directors and allotment of shares.',
  'Attesting to and executing company documents on behalf of the company as may be required by the Board or by law.',
  'Advising on compliance by the company with applicable rules and regulations — Corporate Governance obligations and the requirements of the Companies and Allied Matters Act, Cap C20, LFN 2004, the Nigerian Stock Exchange and the Securities and Exchange Commission, where relevant and applicable.',
  'Formation and conversion of companies and corporations.',
];

const documentationServices = [
  'Drafting of Agreements',
  'Drafting and registration of Title documents',
  'Trade Marks and Patent Right registration',
  'Management of properties',
];

const partners = [
  {
    name: 'Kehinde Omotayo Ayodele (Mrs.)',
    credentials: 'LL.B (Hons), B.L, LL.M',
    role: 'Principal Partner',
    bio: 'Chartered Secretary & Administrator, member of the Institute of Chartered Secretaries and Administrators of Nigeria. Graduated from Obafemi Awolowo University, Ile Ife in 1992 with a Bachelor of Law (LL.B Hons) and was called to the Nigerian Bar and enrolled at the Supreme Court of Nigeria in 1993. Holds a Masters Degree in Law (LL.M) from the prestigious University of Lagos. 14 years unbroken experience in corporate practice with over 10 years as a Company Secretary/Legal Adviser of a public quoted insurance company. Her experience covers all aspects of corporate and commercial law practice, with a penchant for insurance and finance, documentation and perfection of company securities, debt recovery, litigation, capital market and investment advice. Client focused and solution oriented.',
    features: ['Corporate & Commercial Law', 'Insurance & Finance', 'Capital Market & Investment'],
  },
  {
    name: 'Gbenga Ogunrinde Esq.',
    credentials: 'LL.B (Hons), B.L',
    role: 'Partner & Consultant',
    bio: 'Graduated from the prestigious Obafemi Awolowo University, Ile Ife in 1993 and was enrolled at the Supreme Court of Nigeria in 1994. Subsequently enrolled as a Solicitor of the Supreme Court of England & Wales on 01 July, 1999. Skilled in property matters, litigation, and adept at dealing in immigration matters.',
    features: ['Property Law', 'Litigation', 'Immigration'],
  },
  {
    name: 'Matthew Ovu Esq.',
    credentials: 'LL.B (Hons), B.L',
    role: 'Partner & Consultant',
    bio: 'Graduated from Ambrose Alli University, Ekpoma, Edo State in 2008 and was enrolled at the Supreme Court of Nigeria in 2010. A seasoned lawyer with vast experience in litigation.',
    features: ['Litigation', 'Dispute Resolution'],
  },
  {
    name: 'Arogha Imohohome Shadrach Esq.',
    credentials: 'LL.B (Hons), B.L',
    role: 'Associate',
    bio: 'Graduated from Ambrose Alli University, Ekpoma, Edo State in 2019 with a Bachelor of Law (LL.B Hons) and was enrolled at the Supreme Court of Nigeria in 2021.',
    features: ['Legal Research', 'Corporate Practice'],
  },
];

export function FirmProfilePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-stone-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <Logo size={36} />
            <div className="text-left">
              <p className="text-xs font-semibold tracking-wide text-stone-100 sm:text-sm">K.O AYODELE &amp; CO</p>
              <p className="text-[9px] uppercase tracking-[0.3em] text-amber-300/70 sm:text-[10px]">Firm Profile</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Button to="/login" variant="outline" className="!px-4 !py-2 !text-xs sm:!text-sm">
              Client Login
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Legal library with scales of justice"
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/80 to-stone-950" />
        </div>
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-700/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <div className="mb-6 flex justify-center">
            <Logo size={64} />
          </div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.4em] text-amber-300/70 sm:text-xs">
            Legal Practitioners, Chartered Secretaries and Administrators
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-50 sm:text-4xl md:text-5xl">
            Firm&apos;s Profile
          </h1>
          <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-stone-400">
            A distinguished corporate and commercial law firm delivering trusted counsel,
            steadfast advocacy, and tailored legal solutions across Nigeria and beyond.
          </p>
        </div>
      </section>

      {/* ── Our Firm ── */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-[1fr_1.5fr] sm:gap-16">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/70">Who We Are</p>
            <h2 className="text-2xl font-semibold text-stone-50 sm:text-3xl">Our Firm</h2>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-stone-400 sm:text-base">
            <p>
              K.O Ayodele &amp; Co is led by the Principal Partner, Kehinde Ayodele (Mrs.). Acting
              alone or as a law firm, it is a highly experienced firm with a long and proven track
              record in the practice of Corporate and Commercial law and dispute resolution.
            </p>
            <p>
              The firm has experienced manpower that enables it to engage and advise on
              transnational briefs and matters.
            </p>
          </div>
        </div>
      </section>

      {/* ── Client Service ── */}
      <section className="border-y border-white/5 bg-stone-900/40">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/70">Client Service</p>
            <h2 className="text-2xl font-semibold text-stone-50 sm:text-3xl">Our Service Divisions</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-stone-400">
              As a corporate and commercial law firm, we offer a full spectrum of legal services,
              structured into two main business divisions.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-400/20 bg-amber-900/10 p-6 transition hover:border-amber-400/40 sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-stone-50">Corporate &amp; Commercial Legal Services</h3>
              <p className="mt-2 text-sm text-stone-400">
                Focusing on transactional and regulatory services.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-900/10 p-6 transition hover:border-amber-400/40 sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-stone-50">Litigation &amp; Dispute Resolution</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-stone-400">
                <li className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/60" />
                  Litigation and dispute resolution
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/60" />
                  Mediation and Arbitration
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-stone-400">
            Whilst these are the core areas of service, the firm has full mechanisms to take care of
            all legal matters in Nigeria and across the world.
          </p>
        </div>
      </section>

      {/* ── Description of Services ── */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/70">What We Offer</p>
          <h2 className="text-2xl font-semibold text-stone-50 sm:text-3xl">Description of Services</h2>
        </div>

        {/* Service 1: Corporate & Commercial */}
        <div className="mb-12 space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-50">1. Corporate and Commercial Legal Services</h3>
            </div>
          </div>

          {/* (a) Company & Secretarial */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-amber-300/70" />
              <h4 className="text-base font-semibold text-stone-100">(a) Company and Secretarial Services</h4>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-stone-400">
              K.O Ayodele &amp; Co advises on matters relating to business establishment in Nigeria
              and undertakes the incorporation of companies at the Corporate Affairs Commission. We
              provide a full range of company secretarial services to companies operating within the
              various sectors of the Nigerian economy, including financial services and real estate
              and property development.
            </p>
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-amber-200/70">
              Comprehensive Company Secretarial Services
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {secretarialServices.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-stone-400">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/60" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* (b) Documentations */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-amber-300/70" />
              <h4 className="text-base font-semibold text-stone-100">
                (b) Documentations, Perfection of Titles and Property Management
              </h4>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {documentationServices.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-stone-400">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/60" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Service 2: Litigation */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
              <Gavel className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-stone-50">2. Litigation and Dispute Resolution</h3>
          </div>
          <p className="text-sm leading-relaxed text-stone-400">
            Our litigation and dispute resolution practice focuses on dispute resolution by
            arbitration or by courts of competent jurisdiction.
          </p>
        </div>
      </section>

      {/* ── Legal Resource Persons ── */}
      <section className="border-y border-white/5 bg-stone-900/40">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/70">Our Team</p>
            <h2 className="text-2xl font-semibold text-stone-50 sm:text-3xl">Legal Resource Persons</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {partners.map((p, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-amber-400/30 hover:bg-white/[0.07] sm:p-8"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-stone-50">{p.name}</h3>
                    <p className="mt-0.5 text-xs text-amber-300/70">{p.credentials}</p>
                  </div>
                </div>
                <p className="mb-3 inline-block rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-amber-300">
                  {p.role}
                </p>
                <p className="text-sm leading-relaxed text-stone-400">{p.bio}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {p.features.map((f, j) => (
                    <span
                      key={j}
                      className="rounded-lg border border-white/10 bg-stone-900/50 px-2.5 py-1 text-[11px] text-stone-400"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Office / Contact ── */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/70">Visit Us</p>
          <h2 className="text-2xl font-semibold text-stone-50 sm:text-3xl">Office &amp; Contact</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
              <MapPin className="h-6 w-6" />
            </div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-200/70">Office Address</p>
            <p className="text-sm leading-relaxed text-stone-400">
              25, Osolo Way, Ramotalahi Ayodele Memorial Plaza, Off Airport Road, Ajao Estate, Lagos State, Nigeria
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
              <Phone className="h-6 w-6" />
            </div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-200/70">Telephone</p>
            <a href="tel:08037128020" className="block text-sm text-stone-400 transition hover:text-amber-300">08037128020</a>
            <a href="tel:09017128358" className="block text-sm text-stone-400 transition hover:text-amber-300">09017128358</a>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
              <Mail className="h-6 w-6" />
            </div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-200/70">Email</p>
            <a
              href="mailto:koayodeleandco@gmail.com"
              className="text-sm text-stone-400 transition hover:text-amber-300 break-all"
            >
              koayodeleandco@gmail.com
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-white/5 bg-stone-900/40">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6">
          <h2 className="text-xl font-semibold text-stone-50 sm:text-2xl">Need legal counsel?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-stone-400">
            Register an account to book appointments and submit case presentations directly to our firm.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button to="/register" variant="gold">
              Register Account
            </Button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-amber-300/70 underline-offset-4 transition hover:text-amber-200 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-stone-950 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center text-[11px] text-stone-500 sm:flex-row sm:justify-between sm:text-left">
          <p>25, Osolo Way, Off Airport Road, Ramotalahi Ayodele Memorial Plaza, Ajao Estate, Lagos State, Nigeria</p>
          <p>09017128358 · koayodeleandco@gmail.com</p>
        </div>
      </footer>
    </div>
  );
}
