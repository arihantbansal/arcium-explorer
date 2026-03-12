"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useNetwork } from "@/lib/hooks/use-network";
import { truncateAddress, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SharedComputation } from "./computation-types";

const STATUS_DOT_COLORS: Record<string, string> = {
  queued: "bg-status-queued",
  executing: "bg-status-executing",
  finalized: "bg-status-finalized",
  failed: "bg-status-failed",
};

interface LiveFeedProps {
  computations: SharedComputation[];
  highlightedAddress: string | null;
  onHover: (address: string | null) => void;
}

export function LiveFeed({
  computations,
  highlightedAddress,
  onHover,
}: LiveFeedProps) {
  const network = useNetwork();
  const highlightRef = useRef<HTMLAnchorElement>(null);

  // Tick to refresh "time ago" labels
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to highlighted item when triggered from grid
  useEffect(() => {
    if (highlightedAddress && highlightRef.current) {
      highlightRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedAddress]);

  if (computations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        <div className="text-center">
          <p>No recent computations</p>
          <p className="mt-1 text-xs">
            New computations will appear here in real-time
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Column headers */}
      <div className="grid grid-cols-[8px_1fr_1fr_1fr_1fr_auto] items-center gap-x-4 border-b border-border-muted px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-text-muted">
        <span />
        <span>Address</span>
        <span>Offset</span>
        <span>Payer</span>
        <span>Program</span>
        <span>Time</span>
      </div>
      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {computations.map((comp) => {
          const isHighlighted = highlightedAddress === comp.address;
          const timestamp = comp.queuedAt || comp.createdAt;
          return (
            <Link
              key={comp.address}
              ref={isHighlighted ? highlightRef : undefined}
              href={`/computations/${comp.address}?network=${network}`}
              className={cn(
                "grid grid-cols-[8px_1fr_1fr_1fr_1fr_auto] items-center gap-x-4 rounded-md px-2 py-1.5 transition-colors",
                isHighlighted
                  ? "bg-white/10 ring-1 ring-white/30"
                  : "hover:bg-bg-elevated"
              )}
              onMouseEnter={() => onHover(comp.address)}
              onMouseLeave={() => onHover(null)}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  STATUS_DOT_COLORS[comp.status] || "bg-text-muted"
                }`}
              />
              <span className="truncate font-mono text-xs text-text-primary">
                {truncateAddress(comp.address, 4)}
              </span>
              <span className="font-mono text-xs text-text-secondary">
                {comp.computationOffset}
              </span>
              <span className="truncate font-mono text-xs text-text-muted">
                {truncateAddress(comp.payer, 4)}
              </span>
              <span className="truncate font-mono text-xs text-text-muted">
                {comp.mxeProgramId
                  ? truncateAddress(comp.mxeProgramId, 4)
                  : "—"}
              </span>
              <span className="shrink-0 text-xs text-text-muted">
                {timestamp ? timeAgo(timestamp) : "—"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
