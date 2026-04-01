"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useMxes } from "@/lib/hooks/use-api";
import { useNetwork } from "@/lib/hooks/use-network";
import { DataTable } from "@/components/shared/data-table";
import { AddressDisplay } from "@/components/shared/address-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { ColumnDef } from "@tanstack/react-table";

interface MxeRow {
  address: string;
  mxeProgramId: string;
  clusterOffset: number | null;
  authority: string | null;
  status: string;
}

const columns: ColumnDef<MxeRow, unknown>[] = [
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ getValue }) => <AddressDisplay address={String(getValue())} />,
  },
  {
    accessorKey: "mxeProgramId",
    header: "Program ID",
    cell: ({ getValue }) => <AddressDisplay address={String(getValue())} />,
  },
  {
    accessorKey: "clusterOffset",
    header: "Cluster",
    cell: ({ getValue }) => {
      const v = getValue();
      return v !== null ? (
        <span className="font-mono">{String(v)}</span>
      ) : (
        <span className="text-text-muted">-</span>
      );
    },
  },
  {
    accessorKey: "authority",
    header: "Authority",
    cell: ({ getValue }) => {
      const v = getValue();
      return v ? <AddressDisplay address={String(v)} /> : <span className="text-text-muted">None</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <StatusBadge status={String(getValue()) === "active" ? "active" : "inactive"} />
    ),
  },
];

function MxesContent() {
  const network = useNetwork();
  const router = useRouter();
  const { data: response, isLoading, isError } = useMxes();
  const mxes = (response?.data || []) as MxeRow[];

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">MXE Accounts</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Multi-Party Execution Environment accounts
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-text-muted">
          Loading MXEs...
        </div>
      ) : isError ? (
        <div className="flex h-48 items-center justify-center text-text-muted">
          Failed to load MXEs
        </div>
      ) : (
        <DataTable
          data={mxes}
          columns={columns}
          onRowClick={(row) =>
            router.push(`/mxes/${row.address}?network=${network}`)
          }
        />
      )}
    </div>
  );
}

export default function MxesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-text-muted">Loading...</div>}>
      <MxesContent />
    </Suspense>
  );
}
