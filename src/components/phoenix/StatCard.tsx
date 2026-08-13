import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Icon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function AnimatedCounter({ value, duration = 900 }: { value: number; duration?: number }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const initial = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(initial + (value - initial) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);

  return <span>{display}</span>;
}

export function StatCard({
  label,
  value,
  icon: IconComponent,
  tone = "primary",
  index = 0,
  hint,
}: {
  label: string;
  value: number;
  icon: Icon;
  tone?: "primary" | "warning" | "success" | "emergency";
  index?: number;
  hint?: string;
}) {
  const toneClass = {
    primary: "text-primary bg-primary/12",
    warning: "text-warning bg-warning/12",
    success: "text-success bg-success/12",
    emergency: "text-emergency bg-emergency/12",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
    >
      <Card className="flex flex-row items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">
            <AnimatedCounter value={value} />
          </p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className={cn("grid h-12 w-12 place-items-center rounded-xl", toneClass)}>
          <IconComponent size={24} weight="duotone" />
        </span>
      </Card>
    </motion.div>
  );
}
