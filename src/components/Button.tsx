import type { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  to?: string;
  type?: 'button' | 'submit';
  variant?: 'gold' | 'outline' | 'ghost' | 'danger';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 disabled:opacity-50 disabled:cursor-not-allowed select-none';

const variants: Record<string, string> = {
  gold: 'bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 text-stone-900 shadow-lg shadow-amber-900/30 hover:shadow-xl hover:shadow-amber-700/40 hover:-translate-y-0.5',
  outline:
    'border border-amber-300/40 bg-white/5 text-amber-100 backdrop-blur-md hover:bg-amber-300/10 hover:border-amber-300/70',
  ghost: 'text-amber-100/80 hover:text-amber-50 hover:bg-white/5',
  danger: 'bg-red-900/40 border border-red-400/30 text-red-100 hover:bg-red-800/50',
};

const sizes = 'px-6 py-3 text-sm';

export function Button({
  children,
  to,
  type = 'button',
  variant = 'gold',
  className = '',
  disabled,
  onClick,
  fullWidth,
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes} ${fullWidth ? 'w-full' : ''} ${className}`;

  if (to) {
    return (
      <a href={`#${to}`} className={classes} onClick={() => onClick?.()}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
