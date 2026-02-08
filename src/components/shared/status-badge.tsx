"use client";

import { cn } from "@/lib/utils";
import type { ComputationStatus } from "@/types";
import { STATUS_COLORS } from "@/lib/constants";

interface StatusBadgeProps {
  status: ComputationStatus | "active" | "inactive";
  className?: string;
}

const extraStatusColors = {
  active: {
    bg: "bg-status-queued/10",
    text: "text-status-queued",
    border: "border-status-queued/30",
    dot: "bg-status-queued",
  },
  inactive: {
    bg: "bg-text-muted/10",
    text: "text-text-muted",
    border: "border-text-muted/30",
    dot: "bg-text-muted",
  },
};

const allStatusColors = { ...STATUS_COLORS, ...extraStatusColors };

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors = allStatusColors[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
