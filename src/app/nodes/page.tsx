"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useNodes } from "@/lib/hooks/use-api";
import { useNetwork } from "@/lib/hooks/use-network";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { AddressDisplay } from "@/components/shared/address-display";
import type { ColumnDef } from "@tanstack/react-table";

interface NodeRow {
  offset: number;
  address: string;
  authorityKey: string;
  ip: string | null;
  clusterOffset: number | null;
  cuCapacityClaim: number;
  isActive: boolean;
}

const columns: ColumnDef<NodeRow, unknown>[] = [
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
    cell: ({ getValue }) => <AddressDisplay address={String(getValue())} />,
  },
  {
    accessorKey: "ip",
    header: "IP",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs">{String(getValue() || "N/A")}</span>
    ),
  },
  {
    accessorKey: "clusterOffset",
    header: "Cluster",
    cell: ({ getValue }) => {
      const v = getValue();
      return v !== null && v !== undefined ? (
        <span className="font-mono text-accent-link">{String(v)}</span>
      ) : (
        <span className="text-text-muted">-</span>
      );
    },
  },
  {
    accessorKey: "cuCapacityClaim",
    header: "CU Capacity",
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

function NodesContent() {
  const network = useNetwork();
  const router = useRouter();
  const { data: response, isLoading } = useNodes();
  const nodes = (response?.data || []) as NodeRow[];

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">ARX Nodes</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Individual MPC computation nodes in the Arcium network
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-text-muted">
          Loading nodes...
        </div>
      ) : (
        <DataTable
          data={nodes}
          columns={columns}
          onRowClick={(row) =>
            router.push(`/nodes/${row.offset}?network=${network}`)
          }
        />
      )}
    </div>
  );
}

export default function NodesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-text-muted">Loading...</div>}>
      <NodesContent />
    </Suspense>
  );
}
