"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useClusters } from "@/lib/hooks/use-api";
import { useNetwork } from "@/lib/hooks/use-network";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { AddressDisplay } from "@/components/shared/address-display";
import type { ColumnDef } from "@tanstack/react-table";

interface ClusterRow {
  offset: number;
  address: string;
  clusterSize: number;
  cuPrice: number;
  nodeOffsets: number[];
  isActive: boolean;
}

const columns: ColumnDef<ClusterRow, unknown>[] = [
  {
    accessorKey: "offset",
    header: "Offset",
    cell: ({ getValue }) => (
      <span className="font-mono text-accent-link">{String(getValue())}</span>
    ),
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ getValue }) => (
      <AddressDisplay address={String(getValue())} />
    ),
  },
  {
    accessorKey: "clusterSize",
    header: "Size",
  },
  {
    accessorKey: "nodeOffsets",
    header: "Nodes",
    cell: ({ getValue }) => {
      const offsets = getValue() as number[];
      return offsets?.length || 0;
    },
  },
  {
    accessorKey: "cuPrice",
    header: "CU Price",
    cell: ({ getValue }) => (
      <span className="font-mono">{Number(getValue()).toLocaleString()}</span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ getValue }) => (
      <StatusBadge status={getValue() ? "active" : "inactive"} />
    ),
  },
];

function ClustersContent() {
  const network = useNetwork();
  const router = useRouter();
  const { data: response, isLoading } = useClusters();
  const clusters = (response?.data || []) as ClusterRow[];

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Clusters</h1>
        <p className="mt-1 text-sm text-text-secondary">
          MPC clusters executing confidential computations
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-text-muted">
          Loading clusters\u2026
        </div>
      ) : (
        <DataTable
          data={clusters}
          columns={columns}
          onRowClick={(row) =>
            router.push(`/clusters/${row.offset}?network=${network}`)
          }
        />
      )}
    </div>
  );
}

export default function ClustersPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-text-muted">Loading\u2026</div>}>
      <ClustersContent />
    </Suspense>
  );
}
