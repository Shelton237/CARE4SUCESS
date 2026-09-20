/* Petits éléments décoratifs partagés par les pages vitrine. */

export type FilledIcon = (props: { className?: string }) => JSX.Element;

export const BarsFilled: FilledIcon = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
    <rect x="3" y="17" width="7.5" height="12" rx="2" />
    <rect x="12.3" y="9" width="7.5" height="20" rx="2" />
    <rect x="21.5" y="2" width="7.5" height="27" rx="2" />
  </svg>
);

export const UsersFilled: FilledIcon = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
    <circle cx="16" cy="9" r="4.6" />
    <path d="M7.5 25c0-4.6 3.8-8.2 8.5-8.2s8.5 3.6 8.5 8.2c0 .9-.7 1.6-1.6 1.6H9.1c-.9 0-1.6-.7-1.6-1.6z" />
    <circle cx="5.5" cy="12.5" r="3.4" />
    <path d="M0.5 24.6c0-3.2 2.3-5.8 5.2-6.3-1.2 1.4-1.9 3.2-1.9 5.2 0 .6.1 1.2.3 1.7H2c-.9 0-1.5-.5-1.5-.6z" />
    <circle cx="26.5" cy="12.5" r="3.4" />
    <path d="M31.5 24.6c0-3.2-2.3-5.8-5.2-6.3 1.2 1.4 1.9 3.2 1.9 5.2 0 .6-.1 1.2-.3 1.7H30c.9 0 1.5-.5 1.5-.6z" />
  </svg>
);

export const ShieldFilled: FilledIcon = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <path d="M16 2.5l11 4v8.6c0 6.6-4.5 11.6-11 14.4C9.5 26.7 5 21.7 5 15.1V6.5l11-4z" fill="currentColor" />
    <path d="M10.8 15.8l3.7 3.7 7-7.3" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Trait de soulignement manuscrit (or) sous les textes en écriture. */
export function HandUnderline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={className} aria-hidden>
      <path d="M2 9 C 30 2, 80 2, 118 5" stroke="#F5A623" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export const BarsOutline: FilledIcon = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" aria-hidden>
    <rect x="3.5" y="17.5" width="6.5" height="11" rx="3.2" />
    <rect x="12.7" y="10" width="6.5" height="18.5" rx="3.2" />
    <rect x="21.9" y="3.5" width="6.5" height="25" rx="3.2" />
  </svg>
);

export function TargetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <circle cx="15" cy="17" r="11" />
      <circle cx="15" cy="17" r="6.5" />
      <circle cx="15" cy="17" r="2" fill="currentColor" />
      <path d="M15 17 L27 5 M22 4 v6 h6" />
    </svg>
  );
}

export function MedalFilled({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <path d="M16 3l2.6 2 3.3-.2 1.2 3 2.8 1.8-.7 3.2 1.2 3.1-2.3 2.4-.6 3.2-3.2.7L16 26l-2.3-1.8-3.2-.7-.6-3.2L7.6 18l1.2-3.1-.7-3.2 2.8-1.8 1.2-3 3.3.2z" />
      <path d="M12.5 15.5l2.6 2.6 4.6-5" strokeLinecap="round" />
    </svg>
  );
}

export function UsersOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
      <circle cx="16" cy="11" r="4.2" />
      <path d="M8 26c0-4.6 3.6-8 8-8s8 3.4 8 8" />
      <circle cx="6.5" cy="13.5" r="3" /><path d="M2 24.5c0-2.8 1.9-5 4.5-5.4" />
      <circle cx="25.5" cy="13.5" r="3" /><path d="M30 24.5c0-2.8-1.9-5-4.5-5.4" />
    </svg>
  );
}
