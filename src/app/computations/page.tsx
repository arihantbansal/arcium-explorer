"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useComputations } from "@/lib/hooks/use-api";
import { useNetwork } from "@/lib/hooks/use-network";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { AddressDisplay } from "@/components/shared/address-display";
import { cn, timeAgo } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { ComputationStatus } from "@/types";

interface ComputationRow {
  address: string;
  compDefOffset: string;
  clusterOffset: number;
  payer: string;
  status: ComputationStatus;
  queuedAt: string | null;
  finalizedAt: string | null;
  mxeProgramId: string | null;
}

const columns: ColumnDef<ComputationRow, unknown>[] = [
  {
    accessorKey: "compDefOffset",
    header: "Def #",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-accent-link">
        {String(getValue())}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <StatusBadge status={getValue() as ComputationStatus} />
    ),
  },
  {
    accessorKey: "clusterOffset",
    header: "Cluster",
    cell: ({ getValue }) => (
      <span className="font-mono">{String(getValue())}</span>
    ),
  },
  {
    accessorKey: "payer",
    header: "Payer",
    cell: ({ getValue }) => <AddressDisplay address={String(getValue())} />,
  },
  {
    accessorKey: "mxeProgramId",
    header: "Program",
    cell: ({ getValue }) => {
      const v = getValue();
      return v ? <AddressDisplay address={String(v)} /> : <span className="text-text-muted">-</span>;
    },
  },
  {
    accessorKey: "queuedAt",
    header: "Queued",
    cell: ({ getValue }) => {
      const v = getValue();
      return v ? (
        <span className="text-xs text-text-secondary">{timeAgo(String(v))}</span>
      ) : (
        <span className="text-text-muted">-</span>
      );
    },
  },
];

const STATUS_FILTERS: (ComputationStatus | "all")[] = [
  "all",
  "queued",
  "executing",
  "finalized",
  "failed",
];

function ComputationsContent() {
  const network = useNetwork();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  const setStatusFilter = useCallback(
    (status: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (status === "all") {
        params.delete("status");
      } else {
        params.set("status", status);
      }
      router.replace(`/computations?${params.toString()}`);
    },
    [searchParams, router]
  );

  const { data: response, isLoading } = useComputations(1, 50, {
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const computations = (response?.data || []) as ComputationRow[];

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Computations
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Confidential MPC computations across all clusters
        </p>
      </div>

      {/* Status filters */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
              statusFilter === status
                ? "border-accent-arcium/50 bg-accent-arcium/10 text-accent-arcium"
                : "border-border-primary bg-bg-surface text-text-secondary hover:text-text-primary"
            )}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-text-muted">
          Loading computations\u2026
        </div>
      ) : (
        <DataTable
          data={computations}
          columns={columns}
          onRowClick={(row) =>
            router.push(`/computations/${row.address}?network=${network}`)
          }
        />
      )}
    </div>
  );
}

export default function ComputationsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-text-muted">Loading\u2026</div>}>
      <ComputationsContent />
    </Suspense>
  );
}
