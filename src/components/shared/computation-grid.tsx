"use client";

import { useRef, useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useNetwork } from "@/lib/hooks/use-network";
import { truncateAddress, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { UNENRICHABLE_SENTINEL } from "@/lib/arcium-errors";
import type { SharedComputation } from "./computation-types";

// Phase colors — reference CSS variables so theme changes propagate
export const PHASE_COLORS = {
  queued: "var(--status-queued)",
  callbackOk: "var(--status-finalized)",
  callbackError: "var(--status-failed)",
  pending: "var(--text-muted)",
} as const;

const MAX_COLS = 5;
const GAP = 6;

interface ComputationGridProps {
  computations: SharedComputation[];
  highlightedAddress: string | null;
  onHover: (address: string | null) => void;
  className?: string;
}

export const ComputationGrid = memo(function ComputationGrid({
  computations,
  highlightedAddress,
  onHover,
  className,
}: ComputationGridProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const network = useNetwork();
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = entry.contentRect.width;
      if (width > 0) setContainerWidth(width);
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  // Responsive columns: max 5, min width ~120px per tile
  const cols =
    containerWidth > 0
      ? Math.min(MAX_COLS, Math.max(1, Math.floor((containerWidth + GAP) / (120 + GAP))))
      : 0;

  const handleClick = useCallback(
    (tile: SharedComputation) => {
      router.push(`/computations/${tile.address}?network=${network}`);
    },
    [router, network]
  );

  const handleMouseEnter = useCallback(
    (_e: React.MouseEvent, tile: SharedComputation) => {
      onHover(tile.address);
    },
    [onHover]
  );

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  if (computations.length === 0) {
    return (
      <div ref={wrapperRef} className={cn("w-full", className)}>
        <div className="flex h-48 items-center justify-center text-sm text-text-muted">
          <div className="text-center">
            <p>No computations indexed yet</p>
            <p className="mt-1 text-xs">
              Computations will appear here as they are discovered
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (cols === 0) {
    return (
      <div ref={wrapperRef} className={cn("w-full", className)}>
        <div className="flex h-48 items-center justify-center text-sm text-text-muted">
          Loading grid...
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: `${GAP}px`,
        }}
      >
        {computations.map((tile) => {
          const isFinalized = tile.status === "finalized";
          const isFailed = tile.status === "failed";
          const hasError =
            tile.callbackErrorCode !== null && tile.callbackErrorCode > 0;
          // Check callbackErrorCode directly too — covers the race window where
          // the enricher set the error code but the indexer overwrote status.
          // Exclude unenrichable sentinel from triggering the callback indicator.
          const hasCallback =
            isFinalized || isFailed || (tile.callbackErrorCode !== null && tile.callbackErrorCode !== UNENRICHABLE_SENTINEL);
          const isHighlighted = highlightedAddress === tile.address;
          const timestamp = tile.queuedAt || tile.createdAt;

          return (
            <div
              key={tile.address}
              role="button"
              tabIndex={0}
              className={cn(
                "flex cursor-pointer flex-col overflow-hidden rounded-md border transition-[border-color,box-shadow,transform]",
                isHighlighted
                  ? "border-white/60 ring-1 ring-white/40 scale-[1.03] z-10"
                  : "border-border-primary hover:border-white/30"
              )}
              style={{ backgroundColor: "var(--bg-primary)" }}
              onClick={() => handleClick(tile)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(tile);
                }
              }}
              onMouseEnter={(e) => handleMouseEnter(e, tile)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Info section */}
              <div className="px-2.5 pt-2 pb-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium text-text-primary">
                    {truncateAddress(tile.address, 4)}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {timestamp ? timeAgo(timestamp) : "—"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[10px] text-text-muted break-all">
                    Def
                  </span>
                  <span className="text-[10px] capitalize text-text-secondary">
                    {tile.status}
                  </span>
                </div>
                <div className="text-[10px] text-text-muted font-mono break-all">
                  #{tile.compDefOffset}
                </div>
              </div>
              {/* Q/C phase indicators — link to Solscan tx when sig available */}
              <div className="flex items-center justify-evenly pb-3 pt-1">
                {(() => {
                  const queueUrl = tile.queueTxSig
                    ? `https://solscan.io/tx/${tile.queueTxSig}${network === "devnet" ? "?cluster=devnet" : ""}`
                    : null;
                  const Tag = queueUrl ? "a" : "span";
                  const linkProps = queueUrl
                    ? { href: queueUrl, target: "_blank", rel: "noopener noreferrer", onClick: (e: React.MouseEvent) => e.stopPropagation() }
                    : {};
                  return (
                    <Tag
                      {...linkProps}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 transition-[filter,box-shadow]"
                      style={{ color: PHASE_COLORS.queued }}
                      onMouseEnter={(e) => {
                        if (queueUrl) {
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 8px var(--status-queued)";
                          (e.currentTarget as HTMLElement).style.filter = "brightness(1.25)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow = "";
                        (e.currentTarget as HTMLElement).style.filter = "";
                      }}
                    >
                      <span className="text-[10px] font-semibold">Queue</span>
                      <span className="text-xl font-black leading-none">↑</span>
                    </Tag>
                  );
                })()}
                {(() => {
                  const callbackColor = hasCallback
                    ? hasError ? PHASE_COLORS.callbackError : PHASE_COLORS.callbackOk
                    : PHASE_COLORS.pending;
                  const glowColor = hasCallback
                    ? hasError ? "var(--status-failed)" : "var(--status-finalized)"
                    : null;
                  const callbackUrl = tile.finalizeTxSig
                    ? `https://solscan.io/tx/${tile.finalizeTxSig}${network === "devnet" ? "?cluster=devnet" : ""}`
                    : null;
                  const Tag = callbackUrl ? "a" : "span";
                  const linkProps = callbackUrl
                    ? { href: callbackUrl, target: "_blank", rel: "noopener noreferrer", onClick: (e: React.MouseEvent) => e.stopPropagation() }
                    : {};
                  return (
                    <Tag
                      {...linkProps}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 transition-[filter,box-shadow]"
                      style={{
                        color: callbackColor,
                        opacity: hasCallback ? 1 : 0.4,
                      }}
                      onMouseEnter={(e) => {
                        if (callbackUrl && glowColor) {
                          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 8px ${glowColor}`;
                          (e.currentTarget as HTMLElement).style.filter = "brightness(1.25)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow = "";
                        (e.currentTarget as HTMLElement).style.filter = "";
                      }}
                    >
                      <span className="text-xl font-black leading-none">
                        {hasError ? "!" : "↓"}
                      </span>
                      <span className="text-[10px] font-semibold">Callback</span>
                    </Tag>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
});
