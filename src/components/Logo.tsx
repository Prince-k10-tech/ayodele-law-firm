export function Logo({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7E07B" />
          <stop offset="0.5" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#A37A12" />
        </linearGradient>
      </defs>
      <circle cx="48" cy="48" r="46" stroke="url(#goldGrad)" strokeWidth="2" opacity="0.4" />
      <path d="M48 8 L48 24" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M48 24 L24 36" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M48 24 L72 36" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 44 L80 44" stroke="url(#goldGrad)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="38" r="8" fill="url(#goldGrad)" opacity="0.18" />
      <circle cx="72" cy="38" r="8" fill="url(#goldGrad)" opacity="0.18" />
      <path d="M24 36 C20 42 20 50 24 54 C28 50 28 42 24 36 Z" fill="url(#goldGrad)" />
      <path d="M72 36 C68 42 68 50 72 54 C76 50 76 42 72 36 Z" fill="url(#goldGrad)" />
      <path d="M24 54 L48 54 L72 54" stroke="url(#goldGrad)" strokeWidth="1.5" opacity="0.6" />
      <rect x="40" y="60" width="16" height="22" rx="2" fill="url(#goldGrad)" />
      <rect x="34" y="80" width="28" height="4" rx="2" fill="url(#goldGrad)" />
    </svg>
  );
}
