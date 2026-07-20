import type { SVGProps } from "react";

/** Two-tone stylized checkmark used for bullet lists (per brief). */
export function CheckBadge({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="11" className="fill-teal/12" />
      <circle cx="12" cy="12" r="8.5" className="fill-teal" />
      <path
        d="M8.2 12.2l2.5 2.5 4.9-5.2"
        fill="none"
        stroke="#F4EEE6"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Gold two-tone check, used on darker/gold surfaces. */
export function CheckGold({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="11" className="fill-gold/20" />
      <circle cx="12" cy="12" r="8.5" className="fill-gold" />
      <path
        d="M8.2 12.2l2.5 2.5 4.9-5.2"
        fill="none"
        stroke="#011223"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PhoneIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11 21 3 13 3 3c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1z"
      />
    </svg>
  );
}

export function ShieldIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 2l8 3v6c0 5-3.4 9.2-8 11-4.6-1.8-8-6-8-11V5l8-3zm-1 13l6-6-1.4-1.4L11 12.2 8.4 9.6 7 11l4 4z"
      />
    </svg>
  );
}

export function LockIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v3H9V7a3 3 0 0 1 3-3zm0 10a1.75 1.75 0 0 1 1 3.2V19h-2v-1.8A1.75 1.75 0 0 1 12 14z"
      />
    </svg>
  );
}

export function ClockIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10V6h-2v7h6v-2h-4z"
      />
    </svg>
  );
}

export function MedicalIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M3 12h3l2-5 3 9 2.5-6 1.5 2H21v2h-6l-1.5-2-2.5 6-3-9-1 2H3z"
      />
      <path fill="currentColor" d="M18 4a3 3 0 0 1 3 3c0 2-3 4-3 4s-3-2-3-4a3 3 0 0 1 3-3z" opacity=".35" />
    </svg>
  );
}

export function HomeIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path fill="currentColor" d="M12 3l9 8h-3v9h-4v-6h-4v6H6v-9H3z" />
    </svg>
  );
}

export function RouteIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 20V9a3 3 0 0 1 3-3h6a3 3 0 0 0 3-3M6 20a2 2 0 1 1-.01-.01M18 3a2 2 0 1 1 .01.01"
      />
    </svg>
  );
}

export function BrainIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 4a3 3 0 0 0-3 3v.2A3 3 0 0 0 6 10a3 3 0 0 0 .5 1.7A3 3 0 0 0 6 14a3 3 0 0 0 3 3 3 3 0 0 0 3 1.5V4zm3 0a3 3 0 0 1 3 3v.2A3 3 0 0 1 21 10a3 3 0 0 1-.5 1.7A3 3 0 0 1 21 14a3 3 0 0 1-3 3 3 3 0 0 1-3 1.5V4z"
        opacity=".9"
      />
    </svg>
  );
}

export function DocIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path fill="currentColor" d="M6 2h8l4 4v16H6zM13 3v4h4" opacity=".95" />
      <path fill="#F4EEE6" d="M8 12h8v1.5H8zM8 15h8v1.5H8zM8 9h4v1.5H8z" />
    </svg>
  );
}

export function ChatIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path fill="currentColor" d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-5 4z" />
      <path fill="#F4EEE6" d="M7 8h10v1.6H7zM7 11h6v1.6H7z" />
    </svg>
  );
}

export function UsersIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm0 2c-3 0-6 1.5-6 4v2h12v-2c0-2.5-3-4-6-4zm8-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-.6 0-1.2.1-1.7.2 1.1.9 1.7 2 1.7 3.8v2h5v-2c0-2.5-2.7-4-5-4z"
      />
    </svg>
  );
}

export function Star({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z"
      />
    </svg>
  );
}

/** Row of gold stars. */
export function Stars({ count = 5, className = "" }: { count?: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 text-gold" />
      ))}
    </span>
  );
}

/** Multi-color Google "G" mark. */
export function GoogleG({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.6H24v8.7h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.2z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.2 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.2-3 .7-4.3v-5.7H4.5C3 16.9 2.1 20.3 2.1 24s.9 7.1 2.4 10l7.3-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.1 29.9 2 24 2 15.4 2 8.1 6.8 4.5 14l7.3 5.7c1.7-5.2 6.5-9 12.2-9z"
      />
    </svg>
  );
}

/** "4.9 ★ Google Reviews" badge for the hero (per brief). */
export function GoogleBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-2.5 shadow-card ring-1 ring-ink/5 backdrop-blur ${className}`}
    >
      <GoogleG className="h-7 w-7 shrink-0" />
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-ink">4.9</span>
          <Stars count={5} className="translate-y-[-1px]" />
        </div>
        <div className="text-xs font-medium text-body">Google Reviews</div>
      </div>
    </div>
  );
}
