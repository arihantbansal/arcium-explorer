"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { usePrograms } from "@/lib/hooks/use-api";
import { useNetwork } from "@/lib/hooks/use-network";
import { DataTable } from "@/components/shared/data-table";
import { AddressDisplay } from "@/components/shared/address-display";
import type { ColumnDef } from "@tanstack/react-table";

interface ProgramRow {
  programId: string;
  mxeAddress: string;
  compDefCount: number;
  computationCount: number;
}

const columns: ColumnDef<ProgramRow, unknown>[] = [
  {
    accessorKey: "programId",
    header: "Program ID",
    cell: ({ getValue }) => (
      <AddressDisplay address={String(getValue())} chars={6} />
    ),
  },
  {
    accessorKey: "mxeAddress",
    header: "MXE",
    cell: ({ getValue }) => <AddressDisplay address={String(getValue())} />,
  },
  {
    accessorKey: "compDefCount",
    header: "Definitions",
    cell: ({ getValue }) => (
      <span className="font-mono">{String(getValue())}</span>
    ),
  },
  {
    accessorKey: "computationCount",
    header: "Computations",
    cell: ({ getValue }) => (
      <span className="font-mono">{Number(getValue()).toLocaleString()}</span>
    ),
  },
];

function ProgramsContent() {
  const network = useNetwork();
  const router = useRouter();
  const { data: response, isLoading } = usePrograms();
  const programs = (response?.data || []) as ProgramRow[];

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Programs</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Solana programs using Arcium for confidential computation
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-text-muted">
          Loading programs\u2026
        </div>
      ) : (
        <DataTable
          data={programs}
          columns={columns}
          onRowClick={(row) =>
            router.push(`/programs/${row.programId}?network=${network}`)
          }
        />
      )}
    </div>
  );
}

export default function ProgramsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-text-muted">Loading\u2026</div>}>
      <ProgramsContent />
    </Suspense>
  );
}
