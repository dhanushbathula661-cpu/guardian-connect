import { cn } from "@/lib/utils";

interface PhoenixLogoProps {
  className?: string;
  showWordmark?: boolean;
  subtitle?: boolean;
}

/** Shield + rising phoenix wings + emergency signal. */
export function PhoenixMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="PHOENIX logo"
      className={cn("h-9 w-9", className)}
    >
      <defs>
        <linearGradient id="phoenix-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <path
        d="M24 3 6 10v13c0 11 7.6 18.7 18 22 10.4-3.3 18-11 18-22V10L24 3Z"
        fill="url(#phoenix-mark)"
        opacity="0.16"
      />
      <path
        d="M24 3 6 10v13c0 11 7.6 18.7 18 22 10.4-3.3 18-11 18-22V10L24 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M24 13.5 15 26.5h6.2L18 35l12-13.5h-6.4L28 13.5h-4Z"
        fill="currentColor"
      />
      <path
        d="M11 20c3.4.6 5.6 2.3 7 4.8M37 20c-3.4.6-5.6 2.3-7 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.7"
        fill="none"
      />
    </svg>
  );
}

export function PhoenixLogo({ className, showWordmark = true, subtitle = false }: PhoenixLogoProps) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <PhoenixMark className="text-primary" />
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-bold tracking-[0.22em] text-foreground">
            PHOENIX
          </span>
          {subtitle ? (
            <span className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground">
              Smart Public Safety &amp; Emergency Response
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
