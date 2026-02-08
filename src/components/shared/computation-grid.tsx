"use client";

import { useRef, useEffect, useCallback } from "react";
import { useComputations } from "@/lib/hooks/use-api";

const STATUS_COLORS_HEX = {
  queued: "#4ade80",
  executing: "#fbbf24",
  finalized: "#a78bfa",
  failed: "#f87171",
};

const CELL_SIZE = 12;
const GAP = 2;
const COLS = 20;

export function ComputationGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: response } = useComputations(1, 200);
  const computations = (response?.data || []) as Array<{
    status: keyof typeof STATUS_COLORS_HEX;
    address: string;
  }>;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rows = Math.max(5, Math.ceil(computations.length / COLS));
    const width = COLS * (CELL_SIZE + GAP) - GAP;
    const height = rows * (CELL_SIZE + GAP) - GAP;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw cells
    for (let i = 0; i < Math.max(computations.length, COLS * 5); i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = col * (CELL_SIZE + GAP);
      const y = row * (CELL_SIZE + GAP);

      if (i < computations.length) {
        const color =
          STATUS_COLORS_HEX[computations[i].status] || "#363a54";
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
      } else {
        ctx.fillStyle = "#2a2d42";
        ctx.globalAlpha = 0.3;
      }

      ctx.beginPath();
      ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }, [computations]);

  useEffect(() => {
    draw();
  }, [draw]);

  if (computations.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-text-muted">
        <div className="text-center">
          <p>No computations indexed yet</p>
          <p className="mt-1 text-xs">Computations will appear here as they are discovered</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <canvas ref={canvasRef} className="w-full" />
      <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
        {Object.entries(STATUS_COLORS_HEX).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span className="capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
