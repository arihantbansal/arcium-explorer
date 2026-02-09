"use client";

import { Suspense } from "react";
import { useStats, useStatsHistory } from "@/lib/hooks/use-api";
import { MetricCard } from "@/components/shared/metric-card";
import { formatNumber } from "@/lib/utils";
import {
  Server,
  Cpu,
  Activity,
  Layers,
  Code,
  Shield,
} from "lucide-react";
import { ComputationGrid, STATUS_COLORS_HEX } from "@/components/shared/computation-grid";
import { ThroughputChart } from "@/components/shared/throughput-chart";
import { LiveFeed } from "@/components/shared/live-feed";

function DashboardContent() {
  const { data: statsResponse, isLoading } = useStats();
  const { data: historyResponse } = useStatsHistory(50);
  const stats = statsResponse?.data as Record<string, number> | undefined;
  const history = (historyResponse?.data || []) as Array<{
    timestamp: string;
    totalComputations: number;
    computationsPerMin: number;
    activeNodes: number;
  }>;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Arcium Network Explorer
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Real-time visibility into confidential computations on the Arcium MPC
          network
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          label="Clusters"
          value={isLoading ? "..." : formatNumber(stats?.totalClusters || 0)}
          icon={Layers}
        />
        <MetricCard
          label="Active Nodes"
          value={isLoading ? "..." : formatNumber(stats?.activeNodes || 0)}
          icon={Server}
        />
        <MetricCard
          label="Computations"
          value={isLoading ? "..." : formatNumber(stats?.totalComputations || 0)}
          icon={Cpu}
        />
        <MetricCard
          label="Queued"
          value={isLoading ? "..." : formatNumber(stats?.queuedComputations || 0)}
          icon={Activity}
        />
        <MetricCard
          label="Programs"
          value={isLoading ? "..." : formatNumber(stats?.totalPrograms || 0)}
          icon={Code}
        />
        <MetricCard
          label="MXEs"
          value={isLoading ? "..." : formatNumber(stats?.totalMxes || 0)}
          icon={Shield}
        />
      </div>

      {/* Computation grid + live feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="rounded-lg border border-border-primary bg-bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-text-secondary">
                Computation Grid
              </h2>
              <div className="flex items-center gap-3 text-xs text-text-muted">
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
            <ComputationGrid />
          </div>
        </div>
        <div>
          <div className="flex h-full flex-col rounded-lg border border-border-primary bg-bg-surface p-4">
            <h2 className="mb-4 text-sm font-medium text-text-secondary">
              Live Feed
            </h2>
            <LiveFeed />
          </div>
        </div>
      </div>

      {/* Throughput chart */}
      <div className="rounded-lg border border-border-primary bg-bg-surface p-4">
        <h2 className="mb-4 text-sm font-medium text-text-secondary">
          Throughput
        </h2>
        <ThroughputChart data={history} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-text-muted">Loading...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
