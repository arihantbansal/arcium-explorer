import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  href?: string;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  href,
  trend,
  className,
}: MetricCardProps) {
  const card = (
    <div
      className={cn(
        "rounded-lg border border-border-primary bg-bg-surface p-4",
        href && "hover:border-white/30 hover:bg-bg-elevated transition-colors cursor-pointer",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-text-muted" />}
      </div>
      <p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p>
      {trend && (
        <p
          className={cn(
            "mt-1 text-xs",
            trend.value >= 0 ? "text-status-queued" : "text-status-failed"
          )}
        >
          {trend.value >= 0 ? "+" : ""}
          {trend.value}% {trend.label}
        </p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }

  return card;
}
