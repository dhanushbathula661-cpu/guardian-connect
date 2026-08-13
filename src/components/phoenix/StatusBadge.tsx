import { cn } from "@/lib/utils";
import { labelize } from "@/lib/phoenix/constants";

type Tone = "emergency" | "warning" | "info" | "success" | "muted";

const TONE_CLASS: Record<Tone, string> = {
  emergency: "bg-emergency/15 text-emergency border-emergency/40",
  warning: "bg-warning/15 text-warning border-warning/40",
  info: "bg-info/15 text-info border-info/40",
  success: "bg-success/15 text-success border-success/40",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({
  status,
  tone,
  className,
}: {
  status: string;
  tone: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {labelize(status)}
    </span>
  );
}
