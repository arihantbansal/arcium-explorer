"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useComputations } from "@/lib/hooks/use-api";
import { useNetwork } from "@/lib/hooks/use-network";
import { getArciumError } from "@/lib/arcium-errors";
import { cn } from "@/lib/utils";

// Phase colors for the legend
export const PHASE_COLORS = {
  queued: "#4ade80",
  callbackOk: "#6D45FF",
  callbackError: "#f87171",
  pending: "#6b7280",
} as const;

const MIN_CELL_SIZE = 28;
const GAP = 3;
const MAX_SIDE = 20;
const MAX_CELLS = MAX_SIDE * MAX_SIDE;

interface ComputationTile {
  address: string;
  status: string;
  callbackErrorCode: number | null;
  queuedAt: string | null;
  finalizedAt: string | null;
}

interface TooltipData {
  x: number;
  y: number;
  tile: ComputationTile;
}

export function ComputationGrid({ className }: { className?: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const network = useNetwork();
  const [containerWidth, setContainerWidth] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const { data: response } = useComputations(1, MAX_CELLS);
  const computations = (response?.data || []) as ComputationTile[];

  // Observe container size
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

  // Grid dimensions
  const count = Math.min(computations.length, MAX_CELLS);
  const cols =
    containerWidth > 0
      ? Math.min(MAX_SIDE, Math.max(1, Math.floor((containerWidth + GAP) / (MIN_CELL_SIZE + GAP))))
      : 0;
  const rows = cols > 0 ? Math.ceil(count / cols) : 0;
  const cellSize =
    cols > 0 ? Math.floor((containerWidth - GAP * (cols - 1)) / cols) : 0;

  const handleClick = useCallback(
    (tile: ComputationTile) => {
      router.push(`/computations/${tile.address}?network=${network}`);
    },
    [router, network]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, tile: ComputationTile) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        tile,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (computations.length === 0) {
    return (
      <div ref={wrapperRef} className={cn("aspect-square w-full", className)}>
        <div className="flex h-full items-center justify-center text-sm text-text-muted">
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
      <div ref={wrapperRef} className={cn("aspect-square w-full", className)}>
        <div className="flex h-full items-center justify-center text-sm text-text-muted">
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
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gap: `${GAP}px`,
        }}
      >
        {computations.slice(0, cols * rows).map((tile) => {
          const isFinalized = tile.status === "finalized";
          const isFailed = tile.status === "failed";
          const hasCallback = isFinalized || isFailed;
          const hasError =
            tile.callbackErrorCode !== null && tile.callbackErrorCode > 0;

          return (
            <div
              key={tile.address}
              className="flex cursor-pointer overflow-hidden rounded-sm transition-all hover:ring-1 hover:ring-white/40"
              style={{ width: cellSize, height: cellSize }}
              onClick={() => handleClick(tile)}
              onMouseEnter={(e) => handleMouseEnter(e, tile)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Q half — always green (computation exists = queue succeeded) */}
              <div
                className="flex flex-1 items-center justify-center"
                style={{ backgroundColor: PHASE_COLORS.queued, opacity: 0.85 }}
              >
                <span
                  className="font-mono font-bold leading-none text-black/70"
                  style={{ fontSize: Math.max(8, cellSize * 0.3) }}
                >
                  ↑
                </span>
              </div>
              {/* C half */}
              <div
                className="flex flex-1 items-center justify-center"
                style={{
                  backgroundColor: hasCallback
                    ? hasError
                      ? PHASE_COLORS.callbackError
                      : PHASE_COLORS.callbackOk
                    : PHASE_COLORS.pending,
                  opacity: hasCallback ? 0.85 : 0.4,
                }}
              >
                <span
                  className="font-mono font-bold leading-none text-black/70"
                  style={{ fontSize: Math.max(8, cellSize * 0.3) }}
                >
                  {hasCallback ? (hasError ? "!" : "↓") : "↓"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && <GridTooltip data={tooltip} />}
    </div>
  );
}

function GridTooltip({ data }: { data: TooltipData }) {
  const { tile, x, y } = data;
  const hasCallback =
    tile.status === "finalized" || tile.status === "failed";
  const hasError =
    tile.callbackErrorCode !== null && tile.callbackErrorCode > 0;
  const error = hasError ? getArciumError(tile.callbackErrorCode!) : null;

  return (
    <div
      className="pointer-events-none absolute z-50 max-w-xs rounded-md border border-border-primary bg-bg-elevated px-3 py-2 text-xs shadow-lg"
      style={{
        left: x,
        top: y - 8,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="font-mono text-text-primary">
        {tile.address.slice(0, 8)}...{tile.address.slice(-4)}
      </div>
      <div className="mt-1 space-y-0.5 text-text-secondary">
        <div className="flex items-center gap-1.5">
          <span style={{ color: PHASE_COLORS.queued }}>↑ Q:</span>
          <span>Queued{tile.queuedAt ? ` · ${new Date(tile.queuedAt).toLocaleString()}` : ""}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            style={{
              color: hasCallback
                ? hasError
                  ? PHASE_COLORS.callbackError
                  : PHASE_COLORS.callbackOk
                : PHASE_COLORS.pending,
            }}
          >
            {hasCallback ? (hasError ? "! C:" : "↓ C:") : "↓ C:"}
          </span>
          <span>
            {!hasCallback
              ? "Pending"
              : hasError && error
              ? `Error: ${error.name} (${tile.callbackErrorCode}) — ${error.msg}`
              : hasError
              ? `Error code ${tile.callbackErrorCode}`
              : `OK${tile.finalizedAt ? ` · ${new Date(tile.finalizedAt).toLocaleString()}` : ""}`}
          </span>
        </div>
      </div>
    </div>
  );
}
