"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useDefinitions } from "@/lib/hooks/use-api";
import { formatInteger } from "@/lib/utils";
import { useNetwork } from "@/lib/hooks/use-network";
import { DataTable } from "@/components/shared/data-table";
import { AddressDisplay } from "@/components/shared/address-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { ColumnDef } from "@tanstack/react-table";

interface DefRow {
  address: string;
  mxeProgramId: string;
  defOffset: number;
  cuAmount: number;
  circuitLen: number;
  sourceType: string;
  isCompleted: boolean;
}

const columns: ColumnDef<DefRow, unknown>[] = [
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ getValue }) => <AddressDisplay address={String(getValue())} />,
  },
  {
    accessorKey: "mxeProgramId",
    header: "Program",
    cell: ({ getValue }) => <AddressDisplay address={String(getValue())} />,
  },
  {
    accessorKey: "defOffset",
    header: "Offset",
    cell: ({ getValue }) => <span className="font-mono">{String(getValue())}</span>,
  },
  {
    accessorKey: "cuAmount",
    header: "CU Amount",
    cell: ({ getValue }) => <span className="font-mono">{formatInteger(Number(getValue()))}</span>,
  },
  {
    accessorKey: "sourceType",
    header: "Source",
  },
  {
    accessorKey: "isCompleted",
    header: "Status",
    cell: ({ getValue }) => (
      <StatusBadge status={getValue() ? "finalized" : "executing"} />
    ),
  },
];

function DefinitionsContent() {
  const network = useNetwork();
  const router = useRouter();
  const { data: response, isLoading, isError } = useDefinitions();
  const defs = (response?.data || []) as DefRow[];

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Computation Definitions</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Circuit definitions for confidential computations
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-text-muted">Loading definitions...</div>
      ) : isError ? (
        <div className="flex h-48 items-center justify-center text-text-muted">Failed to load definitions</div>
      ) : (
        <DataTable
          data={defs}
          columns={columns}
          onRowClick={(row) => router.push(`/definitions/${row.address}?network=${network}`)}
        />
      )}
    </div>
  );
}

export default function DefinitionsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-text-muted">Loading...</div>}>
      <DefinitionsContent />
    </Suspense>
  );
}
